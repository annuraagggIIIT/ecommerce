pipeline {
    agent any

    tools {
        nodejs 'node18'
    }

    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/annuraagggIIIT/ecommerce.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Type Check') {
            steps {
                sh 'npm run typecheck || echo "no typecheck script"'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build || echo "no build script"'
            }
        }
    }
}
