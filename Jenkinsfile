pipeline {
   environment {
       registryCredential = 'docker-hub-credentials'
       appImg = "mbursac/belair-2.0"
       app = ''
       setupEnvImg = "mbursac/setup-environment"
       setupEnv = ''
       buildApkImg = "mbursac/build-apk"
       buildApk = ''
   }

   agent any

   stages {
      stage('Create app environment') {
       steps {
            script {
                setupEnv = docker.build(setupEnvImg, "-f ./docker/setup-environment/Dockerfile .")
            }
        }
      }

      stage('Create app') {
        steps {
            script {
                app = docker.build(appImg, "-f ./docker/create-app/Dockerfile .")
            }
        }
      }

      stage('Build apk') {
        steps {
            script {
               buildApk = docker.build(buildApkImg, "-f ./docker/build-apk/Dockerfile .")
            }
        }
      }

      stage('Copy apk') {
        steps {
            sh 'docker run -v /var/lib/jenkins/workspace/Belair-2.0_V2/builds:/app/builds mbursac/build-apk sh -c "cp /app/platforms/android/app/build/outputs/apk/debug/app-debug.apk /app/builds/app-debug-latest.apk"'
        }
      }

      stage('Push images') {
        steps {
            script {
                docker.withRegistry('', registryCredential) {
                      setupEnv.push()
                      app.push()
                      buildApk.push()
                }
            }
        }
      }

      stage('Stop all containers') {
        steps {
            sh 'docker stop $(docker ps -aq)'
        }
      }

      stage('Remove all containers') {
        steps {
            sh 'docker rm $(docker ps -aq)'
        }
      }

      stage('Send apk link via Slack') {
        steps {
            slackSend channel: '#belair',
            message: "New apk file available at: http://belair.nebulae.be:8080/job/Belair-2.0/job/V2/${env.BUILD_NUMBER}/execution/node/3/ws/builds/"
        }
      }
   }
}


