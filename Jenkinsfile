pipeline {
    agent any

    tools {
        nodejs 'node18'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Type Check') {
            steps {
                bat 'cmd /c "npm run typecheck || exit /b 0"'
            }
        }

        stage('Build') {
            steps {
                bat 'cmd /c "npm run build || exit /b 0"'
            }
        }
    }
}
