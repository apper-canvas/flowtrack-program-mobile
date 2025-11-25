import { getApperClient } from "@/services/apperClient"
import { toast } from "react-toastify"

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const taskService = {
  async getAll() {
    await delay(300)
    
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      }

      const response = await apperClient.fetchRecords("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return []
      }

      if (!response.data || response.data.length === 0) {
        return []
      }

      // Transform database fields to UI format for backward compatibility
      return response.data.map(task => ({
        Id: task.Id,
        title: task.title_c,
        description: task.description_c || "",
        priority: task.priority_c,
        status: task.status_c,
        completedAt: task.completed_at_c,
        createdAt: task.CreatedOn,
        tags: task.Tags
      }))

    } catch (error) {
      console.error("Error fetching tasks:", error?.response?.data?.message || error)
      return []
    }
  },

  async getById(id) {
    await delay(200)
    
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "CreatedOn"}}
        ]
      }

      const response = await apperClient.getRecordById("task_c", parseInt(id), params)

      if (!response.success) {
        console.error(response.message)
        throw new Error(response.message)
      }

      if (!response.data) {
        throw new Error(`Task with Id ${id} not found`)
      }

      // Transform database fields to UI format
      const task = response.data
      return {
        Id: task.Id,
        title: task.title_c,
        description: task.description_c || "",
        priority: task.priority_c,
        status: task.status_c,
        completedAt: task.completed_at_c,
        createdAt: task.CreatedOn,
        tags: task.Tags
      }

    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error)
      throw error
    }
  },

async create(taskData) {
    await delay(400)
    
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Transform UI format to database fields
      const recordData = {
        Name: taskData.title, // Map title to Name field
        title_c: taskData.title,
        description_c: taskData.description || "",
        priority_c: taskData.priority,
        status_c: taskData.status,
        completed_at_c: taskData.completedAt || null,
        Tags: taskData.tags || ""
      };

      // Handle file data if present
      if (taskData.files && taskData.files.length > 0 && window.ApperSDK) {
        const { ApperFileUploader } = window.ApperSDK;
        recordData.files_c = ApperFileUploader.toCreateFormat(taskData.files);
      }

      const params = {
        records: [recordData]
      }

      const response = await apperClient.createRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} records:`, failed)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }

        if (successful.length > 0) {
          // Transform back to UI format
          const task = successful[0].data
          return {
            Id: task.Id,
            title: task.title_c,
            description: task.description_c || "",
            priority: task.priority_c,
            status: task.status_c,
            completedAt: task.completed_at_c,
            createdAt: task.CreatedOn,
            tags: task.Tags
          }
        }
      }

      throw new Error("Failed to create task")

    } catch (error) {
      console.error("Error creating task:", error?.response?.data?.message || error)
      throw error
    }
  },

  async update(id, updates) {
    await delay(300)
    
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Transform UI format to database fields - only include non-empty values
      const dbUpdates = {
        Id: parseInt(id)
      }

      if (updates.title !== undefined && updates.title !== "") {
        dbUpdates.Name = updates.title
        dbUpdates.title_c = updates.title
      }
      if (updates.description !== undefined) {
        dbUpdates.description_c = updates.description
      }
      if (updates.priority !== undefined && updates.priority !== "") {
        dbUpdates.priority_c = updates.priority
      }
      if (updates.status !== undefined && updates.status !== "") {
        dbUpdates.status_c = updates.status
      }
      if (updates.completedAt !== undefined) {
        dbUpdates.completed_at_c = updates.completedAt
      }
      if (updates.tags !== undefined) {
        dbUpdates.Tags = updates.tags
      }

      const params = {
        records: [dbUpdates]
      }

      const response = await apperClient.updateRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records:`, failed)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }

        if (successful.length > 0) {
          // Transform back to UI format
          const task = successful[0].data
          return {
            Id: task.Id,
            title: task.title_c,
            description: task.description_c || "",
            priority: task.priority_c,
            status: task.status_c,
            completedAt: task.completed_at_c,
            createdAt: task.CreatedOn,
            tags: task.Tags
          }
        }
      }

      throw new Error("Failed to update task")

    } catch (error) {
      console.error("Error updating task:", error?.response?.data?.message || error)
      throw error
    }
  },

  async delete(id) {
    await delay(250)
    
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        RecordIds: [parseInt(id)]
      }

      const response = await apperClient.deleteRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} records:`, failed)
          failed.forEach(record => {
            if (record.message) toast.error(record.message)
          })
        }

        return successful.length > 0
      }

      return true

    } catch (error) {
      console.error("Error deleting task:", error?.response?.data?.message || error)
      throw error
    }
  }
}