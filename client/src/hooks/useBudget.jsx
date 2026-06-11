import { useState, useEffect, useCallback } from "react"
import { api } from "../lib/api"

export function useBudget (user) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchItems = useCallback(async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const data = await api.getItems()
            setItems(data.items)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchItems()
    }, [fetchItems])

    const createItem = useCallback(async (body) => {
        const data = await api.createItem(body)
        setItems(prev => [...prev, data.item])
        return data.item
    }, [])

    const updateItem = useCallback(async (id, body) => {
        const data = await api.updateItem(id, body)
        setItems(prev => prev.map(i => i.id === id ? data.item : i))
        return data.item
    }, [])

    const deleteItem = useCallback(async (id) => {
        await api.deleteItem(id)
        setItems(prev => prev.filter(i => i.id !== id))
    }, [])

    return {
        items,
        loading,
        error,
        createItem,
        updateItem,
        deleteItem,
        refetch: fetchItems,
    }

}