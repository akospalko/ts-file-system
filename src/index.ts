// IMPORTS
const fsPromises = require('fs').promises;
const path = require('path');
const cryptoModule = require('crypto');

// INTERFACE
interface LookupIndexInterface {
  [key: string]: string[]
}

// CLASS 
class FS {
  private currentPath: string; // path where content is stored
  private lookupIndexFile: string; // stored content lookup index file
  private hashedContentID: string // md5 hash generated from content used as a lookup for stored content
  private storage: LookupIndexInterface; // content lookup index storage

  // CONSTRUCTOR
  constructor(currentPath?: string) {
    this.currentPath = currentPath || path.join(__dirname, 'storage')
    this.lookupIndexFile = 'LookupIndex.txt' 
    this.hashedContentID = ''
    this.storage = {} 
  }

  // PRIVATE / HELPER METHODS
  // Generate md5 hash for input contents  
  private async hashContent(content: string): Promise<string> {
    if(!content) {
      throw new Error('Content must be provided') 
    }
    // return hash string  
    try {
      return cryptoModule.createHash('md5').update(content).digest('hex');
    } catch (error) {
      throw new Error(`Error generating MD5 hash: ${error}`);
    }
  }

  // Set up directory - create directories, and lookup index file (if non existent)
  private async setUpDirectory(): Promise<void> {
   // check if the directory exists; if not, create it with recursive:true
    try {
      await fsPromises.access(this.currentPath);
    } catch (error) {
      try {
        await fsPromises.mkdir(this.currentPath, { recursive: true });
      } catch (error) {
        throw new Error(`Error creating directory: ${error}`);
      }
    }

    // check if lookup index file exists
    const lookupIndexPath: string = path.join(this.currentPath, this.lookupIndexFile)

    try {
      // check if the lookup index file exists; if not, create it with an empty content
      await fsPromises.access(lookupIndexPath);
    } catch (error) {
      try {
        await fsPromises.writeFile(lookupIndexPath, '');
      } catch (error) {
        throw new Error(`Error creating lookup index file: ${error}`);
      }
    } 
  }

  // Store content in their respective txt files 
  private async storeContentInFile (hashID: string, content: string): Promise<void> {
    const contentFilePath: string = path.join(this.currentPath, `${hashID}.txt`);
    try {
      // check if the file already exists
      await fsPromises.access(contentFilePath);
    } catch (error) {
       // If the file doesn't exist, create it and write the content
       try {
        await fsPromises.writeFile(contentFilePath, content);
      } catch (error) {
        throw new Error(`Error writing content to file: ${error}`);
      }
    } 
  }

  // Read the file and convert it to a storage compatible format
  private async readFileContent(): Promise<LookupIndexInterface> {
    try {
      const lookupIndexPath: string = path.join(this.currentPath, this.lookupIndexFile)
      const data: string = await fsPromises.readFile(lookupIndexPath, 'utf8');
      const lines: string[] = data.split('\n');
      const readObject: LookupIndexInterface = {};

      for (const line of lines) {
        const parts: string[] = line.split(' : ');
        if (parts.length === 2) {
          const [id, filenames] = parts;
          const filenameList: string[] = filenames.split(',').map((filename: string) => filename.trim());
          readObject[id] = filenameList;
        }
      }
      return readObject;
    } catch (error) {
      throw new Error(`Error reading lookup index: ${error}`);
    }
  }

  // Update lookup index: read lookup index, update it, write back to file 
  private async updateLookupIndex(updatedData: LookupIndexInterface, filename: string): Promise<void> {
    try {
      if (!this.storage[this.hashedContentID]) {
        this.storage[this.hashedContentID] = [];
      }
      this.storage[this.hashedContentID].push(filename);

      const readObject: LookupIndexInterface = await this.readFileContent();
      
      for (const key of Object.keys(updatedData)) {
        if (!readObject[key]) {
          readObject[key] = [];
        }

        // use a set for efficient value checking
        const valueSet = new Set(readObject[key]);
        for (const value of updatedData[key]) {
          valueSet.add(value);
        }
        // convert the set back to an array
        readObject[key] = Array.from(valueSet);
      }

      // convert the merged data back to a string
      const updatedContent: string = Object.entries(readObject).map(([key, values]) => {
        return `${key} : ${values.join(', ')}`;
      }).join('\n');

      // write the updated data back to the file by overwriting the entire file
      const lookupIndexPath: string = path.join(this.currentPath, this.lookupIndexFile)
      await fsPromises.writeFile(lookupIndexPath, updatedContent, 'utf8');
    } catch (error) {
      throw new Error(`Couldn't store input data in lookup index file: ${error}`);
    }
  }

  // Initialize the storage from the  lookup index file
  public async initializeStorage(): Promise<void> {
    await this.setUpDirectory();
    this.storage = await this.readFileContent();
  }

  // PUBLIC METHODS
  // STORE - content in filename within the given directory
  public async store(filename: string, content: string): Promise<void> {
    // Handle empty inputs
    if (!filename || !content) {
      throw new Error('Filename and/or content must be provided');
    }

    // Validate filename: allow only alphabetical chars
    // const isValidFilename = /^[A-Za-z]+$/.test(filename);
    // if (!isValidFilename) {
    //   throw new Error('Filename can only contain alphabetical characters');
    // }

    // Check if the content is already stored
    const isFilenameUsed: boolean = Object.values(this.storage).some(item => item.includes(filename));
    if (!isFilenameUsed) {
      // Store file in lookup index  
      // generate content hash which will serve as an id within the lookup index
      this.hashedContentID = await this.hashContent(content);
      // Update the lookup index with the new content
      await this.updateLookupIndex(this.storage, filename);

      // Store the content in a file
      await this.storeContentInFile(this.hashedContentID, content);
    } else {
      // throw new Error(`Filename '${filename}' is already in use. Please select a unique name.`);
    }
  }

  // GET - file's (HashedContentID.txt) content
  public async get(filename:string): Promise<string> {
    // Init storage: set up directories, read stored files from lookup index
    if (Object.keys(this.storage).length === 0) {
      await this.initializeStorage();
    }

    // Find content hash id
    const contentID = Object.keys(this.storage).find(key => this.storage[key].includes(filename));

    // Read and return content 
    if(contentID) {
      // read file content
      try {
        // Read file content
        const contentFilePath = path.join(this.currentPath, `${contentID}.txt`);
        const readContent = await fsPromises.readFile(contentFilePath, 'utf8');
        if (readContent) {
          return readContent;
        }
      } catch (error) {
        // Handle any read errors here
        console.error(`Error reading file: ${error}`);
      }
    }
    return 'File not found';
  }
}

// MAIN
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