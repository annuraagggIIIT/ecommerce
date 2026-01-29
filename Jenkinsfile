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
                bat 'npm run typecheck'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }
    }
}
