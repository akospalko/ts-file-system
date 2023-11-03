
# File System (FS) Documentation
FS is a TypeScript class designed for efficient file system management. It offers features to store and retrieve content, optimized to save space by using content hashing. This documentation provides an overview of FS and how to use it effectively for your file system needs.

## Task description
Write a class (called “FS”) in TypeScript, that takes a directory as an argument which will act as an interface to a file system.

### We need two methods in this class

- store(filename, content): Stores the content in filename within the given directory
- get(filename): Returns the content from the filename

However, people are writing the same data over & over, but using different file names. Our product managers have come up with a method for saving a lot of space. So instead of storing the content as a file using the given filename, store the content using the hash of that content.

### Assumptions
- md5 is a "perfect" hashing function md5("content") -> "abcdef123456"
- filename - only alphabetical characters (no need to validate)

### Requirements
- Content and file-content mapping needs to be persistent too
- The example use-case should be added to the code, so I can test it
- Use a npm/yarn script to start the dev environment
- Dev env setup documentation

### Example usage
```javascript
async function main(): Promise<void> {
  const myFs: FS = new FS('d:/storage/')
  // Initialize storage
  await myFs.initializeStorage()
  // Store content
  await myFs.store('filename1', 'a very long string1')
  await myFs.store('filename2', 'a very long string1')
  await myFs.store('filename3', 'a very long string3')
  await myFs.store('filename2', 'a very long string3') // error: filename is already in use
  // Get content
  const result1: string = await myFs.get('filename1') // gets 'a very long string1'
  const result2: string = await myFs.get('filename2') // gets 'a very long string1'
  const result3: string = await myFs.get('filename3') // gets 'a very long string3'
  console.log(result1);
  console.log(result2);
  console.log(result3);
}

main();
```
- NOTE: In the previous example the “a very long string3” is stored only once, despite two different files having the same content.

## Development Environment Setup

### Clone Repository
- Clone or download the GitHub repository to your local machine.

### Install Dependencies
- Use the command line to navigate to the codebase directory and run `npm install` to install required dependencies.

### Start script
- Run `npm start` to execute the script.

## FS Class Usage
### Set up && initialize storage
To interact with the FS class, follow these steps:

1. **Create an FS instance**:
  - In an async function, such as `main`, create an instance of the FS class.
  - Specify the storage path by passing it to the class constructor.
    - Example: `const myFs: FS = new FS('d:/storage/')`
  - If the path is omitted, the current working directory ( `/src` )  will be used as place for storage.

2. **Initialize Storage**:
  - To set up the storage environment use the `initializeStorage` method.
  - Ensure you await the initialization:
    - Example: `await myFs.initializeStorage()`

### Utilize the `store` and `get`
  - The FS class provides two methods, `store` and `get`, for efficient storage and retrieval of user text inputs in files.
  - Example is available in the code's main function.

#### `store(filename, content)`
- Stores the provided content within a file named `filename` in the specified directory.
  - `filename` (string): The name of the file to store the content. Should consist of alphabetical characters.
  - `content` (string): The text content to be stored in the file.

#### `get(filename)`
- Retrieves the content from the file named `filename`.
  - `filename` (string): The name of the file from which you want to retrieve the content.

## File Structure
1. `LookupIndex.txt`: Handles content and file relation by mapping the content's hash ID and the list of filenames together.
  - File content: `hashed_content_id : filename_1, filename_2, etc.`

2. `ContentFile.txt`: Stores the input text content in a file. The file is named based on the content hash ID.
  - File content: `input text string`.


## Devops
Write a short description of how would you deploy your solution in a cloud environment (AWS, Azure, GCP). What type of resources would you use and why?

### 1. serverless way
- GitHub Repo: Store, organize, and version control code.
- GitHub Actions: Automate TypeScript build and tests, enhancing code quality and reducing manual testing.
- AWS S3: Use S3 for scalable data storage (content file, lookup index).
- AWS Lambda: Achieve serverless deployment for efficiency and cost savings.
- Deployment Stages (e.g., dev, test, prod): Implement stages for controlled testing.
- IAM Roles: Ensure secure resource access with IAM roles.
- AWS CloudWatch: Monitor resource performance for reliability and quick issue resolution.

### 2. containerized way
- Containerization: Use Docker to create a self-contained image with your app, dependencies, and runtime.
- Docker Registry: Store Docker images in a registry (e.g., Docker Hub, AWS ECR) for easy access.
- Orchestration: Employ tools like Kubernetes or Amazon ECS to manage and scale Docker containers.
- CI/CD Integration: Include Docker in your CI/CD pipeline for automated image building and orchestration.
- Cloud Deployment: Deploy your containerized app to your cloud provider (e.g., AWS, Azure, GCP) using services like AWS Fargate or Azure Kubernetes Service.