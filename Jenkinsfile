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

        stage('Generate Prisma Client') {
            steps {
                bat 'npx prisma generate'
            }
        }

        stage('Type Check') {
            steps {
                bat 'npm run typecheck'
            }
        }

        stage('Tests with Coverage') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }
    }
}
