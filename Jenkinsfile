pipeline {
    agent any

    stages {

        stage('Git Checkout') {
            steps {
                git branch: 'main',
                url: 'https://github.com/varun4705/department_management_system.git'
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    bat 'python -m pip install -r requirements.txt'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('events-frontend') {
                    bat 'npm install'
                }
            }
        }

        stage('OWASP Dependency Check') {
            steps {
                bat '''
                "C:\\DevOps\\dependency check\\dependency-check\\bin\\dependency-check.bat" ^
               --project "Department_Management_System" ^
               --scan . ^
               --format HTML ^
               --out dependency-check-report ^
               --nvdApiKey YOUR_API_KEY ^
               --disableYarnAudit
            }
        }

        stage('Publish OWASP Report') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'dependency-check-report',
                    reportFiles: 'dependency-check-report.html',
                    reportName: 'OWASP Dependency Check Report'
                ])
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'Sonar-scanner'

                    withSonarQubeEnv('SonarQube') {

                        bat """
                        ${scannerHome}\\bin\\sonar-scanner.bat ^
                        -Dsonar.projectKey=department ^
                        -Dsonar.projectName=department ^
                        -Dsonar.sources=. ^
                        -Dsonar.host.url=http://localhost:9000 ^
                        -Dsonar.login=squ_dec16b9ad9dd9f6474e38a89812c10c396e63cac
                        """
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t department-management-system .'
            }
        }

        stage('Deploy Container') {
            steps {
                bat 'docker stop department-management-container || exit /b 0'
                bat 'docker rm department-management-container || exit /b 0'

                bat '''
                docker run -d ^
                --name department-management-container ^
                -p 3000:3000 ^
                -p 5000:5000 ^
                department-management-system
                '''
            }
        }

        stage('Render Deployment') {
            steps {
                bat 'echo Render deployment initiated'
            }
        }
    }

    post {

        success {
            echo 'Pipeline Successful!'
        }

        failure {
            echo 'Pipeline Failed!'
        }

        always {
            cleanWs()
        }
    }
}
