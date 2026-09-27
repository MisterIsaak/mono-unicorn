// Jenkinsfile: release/X.Y branches build rc versions; a gated stage promotes to final.

def SERVICES = ['api', 'billing', 'web']

pipeline {
  agent none

  options {
    disableConcurrentBuilds()   // one build per branch at a time, so rc numbers can't race
    skipDefaultCheckout()
    buildDiscarder(logRotator(numToKeepStr: '100'))
  }

  environment {
    REGISTRY = 'registry.example.com/app'
  }

  stages {
    stage('Release candidate') {
      when { branch pattern: 'release/\\d+\\.\\d+', comparator: 'REGEXP' }
      agent { label 'linux' }
      stages {
        stage('Version') {
          steps {
            checkout scm
            script {
              env.BUILT_SHA = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
              retry(3) {
                env.VERSION = tagNextRc(env.BRANCH_NAME - 'release/')
              }
              currentBuild.displayName = env.VERSION
              echo "Version ${env.VERSION} (${env.BUILT_SHA})"
            }
          }
        }

        stage('Build images') {
          steps {
            withCredentials([usernamePassword(credentialsId: 'registry-push',
                                              usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
              sh 'echo "$REG_PASS" | docker login "${REGISTRY%%/*}" -u "$REG_USER" --password-stdin'
            }
            script {
              for (svc in SERVICES) {
                sh """
                  docker build \\
                    --build-arg APP_VERSION=${env.VERSION} \\
                    --build-arg GIT_SHA=${env.BUILT_SHA} \\
                    --label org.opencontainers.image.version=${env.VERSION} \\
                    --label org.opencontainers.image.revision=${env.BUILT_SHA} \\
                    -t ${env.REGISTRY}/${svc}:${env.VERSION} \\
                    -f services/${svc}/Dockerfile .
                  docker push ${env.REGISTRY}/${svc}:${env.VERSION}
                """
              }
            }
          }
        }

        stage('Deploy to staging') {
          steps {
            sh "./deploy/deploy.sh staging ${env.VERSION}"
          }
        }
      }
    }

    stage('Promote to production') {
      when {
        branch pattern: 'release/\\d+\\.\\d+', comparator: 'REGEXP'
        beforeInput true
      }
      options { timeout(time: 7, unit: 'DAYS') }
      input {
        message "Promote ${env.VERSION} to production?"
        ok 'Promote'
        submitter 'qa-approvers'          // Jenkins user or group allowed to approve
        submitterParameter 'APPROVER'
      }
      agent { label 'linux' }             // allocated only after approval, so no executor is held while waiting
      steps {
        checkout scm
        script {
          def finalVersion = env.VERSION.replaceFirst(/-rc\.\d+$/, '')

          // Tag the exact commit that was built and tested, not whatever the branch points to now
          pushTag(env.BUILT_SHA, finalVersion,
                  "Release ${finalVersion} (promoted from ${env.VERSION}, approved by ${APPROVER})")

          withCredentials([usernamePassword(credentialsId: 'registry-push',
                                            usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
            sh 'crane auth login "${REGISTRY%%/*}" -u "$REG_USER" -p "$REG_PASS"'
          }
          for (svc in SERVICES) {
            // Re-tag only: same digest QA approved, nothing rebuilt
            sh "crane tag ${env.REGISTRY}/${svc}:${env.VERSION} ${finalVersion}"
            sh "echo \"${svc} ${finalVersion} \$(crane digest ${env.REGISTRY}/${svc}:${finalVersion})\" >> promoted.txt"
          }
          archiveArtifacts artifacts: 'promoted.txt'

          sh "./deploy/deploy.sh production ${finalVersion}"
          currentBuild.displayName = "${env.VERSION} → ${finalVersion}"
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Versioning helpers
// ---------------------------------------------------------------------------

// Tags HEAD with the next rc for this release line and returns the version.
// If HEAD already has an rc tag (a rerun), that version is reused.
String tagNextRc(String line) {
  if (!(line ==~ /\d+\.\d+/)) {
    error "Not a release branch: ${env.BRANCH_NAME}"
  }
  sh 'git fetch --tags --force --quiet'

  def existing = gitLines("git tag --points-at HEAD --list 'v${line}.*-rc.*'")
  if (existing) {
    def reused = latestRc(existing)
    echo "HEAD already tagged ${reused}, reusing it"
    return reused - 'v'
  }

  def version = nextRc(line, gitLines("git tag --list 'v${line}.*'"))
  pushTag('HEAD', version, "Release candidate ${version}")
  return version
}

// Creates an annotated tag and pushes it. If the push fails (e.g. the tag already
// exists on the server), the local tag is removed so retry() can recompute.
void pushTag(String commit, String version, String message) {
  withCredentials([gitUsernamePassword(credentialsId: 'gitlab-release-bot')]) {
    sh """
      git -c user.name='release-bot' -c user.email='release-bot@example.com' \\
        tag -a 'v${version}' -m '${message}' ${commit}
      git push origin 'refs/tags/v${version}' || { git tag -d 'v${version}'; exit 1; }
    """
  }
}

List<String> gitLines(String cmd) {
  def out = sh(script: cmd, returnStdout: true).trim()
  return out ? out.readLines() : []
}

// Pure logic, kept out of CPS so closures and regexes behave normally.
@NonCPS
String nextRc(String line, List<String> tags) {
  def esc = line.replace('.', '\\.')

  // Next patch = highest final release on this line + 1, or 0 if none
  def finals = tags.findAll { it ==~ /v${esc}\.\d+/ }.collect { it.tokenize('.')[-1] as int }
  int patch = finals ? finals.max() + 1 : 0
  def base = "${line}.${patch}"

  // Next rc = highest rc for that base + 1, or 1 if none
  def escBase = base.replace('.', '\\.')
  def rcs = tags.findAll { it ==~ /v${escBase}-rc\.\d+/ }.collect { it.tokenize('.')[-1] as int }
  int rc = rcs ? rcs.max() + 1 : 1

  return "${base}-rc.${rc}"
}

@NonCPS
String latestRc(List<String> tags) {
  return tags.max { it.tokenize('.')[-1] as int }
}
