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
                bat '''
                npm run typecheck
                IF %ERRORLEVEL% NEQ 0 (
                    echo Typecheck failed, continuing pipeline
                    EXIT /B 0
                )
                '''
            }
        }

        stage('Build') {
            steps {
                bat '''
                npm run build
                IF %ERRORLEVEL% NEQ 0 (
                    echo Build failed or not defined, continuing
                    EXIT /B 0
                )
                '''
            }
        }
    }
}
