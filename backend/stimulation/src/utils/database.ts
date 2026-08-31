// Simple IndexedDB wrapper for project data storage

interface ProjectSnapshot {
  id: string
  projectName: string
  timestamp: number
  projectData: any
  projectPlan: any
}

const DB_NAME = 'ProjectPlannerDB'
const DB_VERSION = 1
const STORE_NAME = 'projects'

class ProjectDatabase {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          objectStore.createIndex('projectName', 'projectName', { unique: false })
        }
      }
    })
  }

  async saveProject(projectName: string, projectData: any, projectPlan: any): Promise<string> {
    if (!this.db) await this.init()

    const snapshot: ProjectSnapshot = {
      id: `${projectName}_${Date.now()}`,
      projectName,
      timestamp: Date.now(),
      projectData,
      projectPlan
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(snapshot)

      request.onsuccess = () => resolve(snapshot.id)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllProjects(): Promise<ProjectSnapshot[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async getProjectsByName(projectName: string): Promise<ProjectSnapshot[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('projectName')
      const request = index.getAll(projectName)

      request.onsuccess = () => {
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getProject(id: string): Promise<ProjectSnapshot | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const projectDB = new ProjectDatabase()
export type { ProjectSnapshot }
