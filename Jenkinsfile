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

        stage('Unit Tests') {
            steps {
                bat 'npm run test:unit'
            }
        }

        stage('Integration Tests') {
            steps {
                bat 'npm run test:integration'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }
    }
}
