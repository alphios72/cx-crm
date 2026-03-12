"use client"
import { useState, useMemo, useRef, useEffect } from "react"

import { format, addDays, startOfWeek, differenceInDays, isSameDay } from "date-fns"
import { it } from "date-fns/locale"
import { Plus, Trash2, Edit, ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { createDeliveryPerson, deleteDeliveryPerson, createDeliveryTask, deleteDeliveryTask, updateDeliveryTask } from "@/actions/delivery"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

type SetupMode = "MONTH" | "QUARTER"

export function DeliveryGantt({ initialPeople, users = [], userRole }: { initialPeople: any[], users?: any[], userRole?: string }) {
    const [people, setPeople] = useState(initialPeople)
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [daysToShow, setDaysToShow] = useState(30)

    // Modals
    const [isPersonModalOpen, setPersonModalOpen] = useState(false)
    const [isTaskModalOpen, setTaskModalOpen] = useState(false)
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
    const [editingTask, setEditingTask] = useState<any | null>(null)

    // Derived dates
    const dates = useMemo(() => {
        return Array.from({ length: daysToShow }).map((_, i) => addDays(startDate, i))
    }, [startDate, daysToShow])

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Person Modal State
    const [personName, setPersonName] = useState("")

    // Task Modal State
    const [taskTitle, setTaskTitle] = useState("")
    const [taskStart, setTaskStart] = useState(format(new Date(), "yyyy-MM-dd"))
    const [taskEnd, setTaskEnd] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"))
    const [taskAssigneeId, setTaskAssigneeId] = useState("")
    const [taskColor, setTaskColor] = useState("#6366f1") // default indigo-500
    const [taskBorderColor, setTaskBorderColor] = useState("#4f46e5") // default indigo-600

    // View Settings
    const [pxPerDay, setPxPerDay] = useState(80)

    const handleFitToScreen = () => {
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        people.forEach(p => {
            p.tasks?.forEach((t: any) => {
                const s = new Date(t.startDate);
                const e = new Date(t.endDate);
                if (!minDate || s < minDate) minDate = s;
                if (!maxDate || e > maxDate) maxDate = e;
            });
        });

        if (minDate && maxDate) {
            const start = addDays(minDate, -2);
            const end = addDays(maxDate, 2);
            const diff = differenceInDays(end, start);

            setStartDate(start);
            setDaysToShow(diff > 0 ? diff : 30);

            if (scrollContainerRef.current) {
                const containerWidth = scrollContainerRef.current.clientWidth - 192; // 192 is the width of the label column
                const newPx = Math.max(10, Math.floor(containerWidth / (diff || 1)));
                setPxPerDay(newPx);
            } else {
                setPxPerDay(20);
            }
        }
    }

    // URL Param loading
    const searchParams = useSearchParams()
    const urlTaskId = searchParams.get('taskId')

    useEffect(() => {
        if (urlTaskId && people.length > 0) {
            let foundTask: any = null;
            let foundPersonId: string | null = null;
            for (const p of people) {
                const t = p.tasks?.find((x: any) => x.id === urlTaskId)
                if (t) {
                    foundTask = t;
                    foundPersonId = p.id;
                    break;
                }
            }
            if (foundTask && !isTaskModalOpen) {
                setStartDate(addDays(new Date(foundTask.startDate), -2))
                openEditTaskModal(foundTask, foundPersonId!, { stopPropagation: () => { } } as any)
            }
        }
    }, [urlTaskId]) // run once on initialization if people exist

    // Admin Handlers
    const handleCreatePerson = async (e: React.FormEvent) => {
        e.preventDefault()
        const fd = new FormData()
        fd.append("name", personName)
        await createDeliveryPerson(fd)
        setPersonModalOpen(false)
        setPersonName("")
        window.location.assign(window.location.pathname) // reload without query params
    }

    const handleDeletePerson = async (id: string) => {
        if (!confirm("Are you sure?")) return
        await deleteDeliveryPerson(id)
        window.location.assign(window.location.pathname)
    }

    // Task Handlers
    const handleTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedPersonId) return

        const fd = new FormData()
        fd.append("personId", selectedPersonId)
        fd.append("title", taskTitle)
        fd.append("startDate", taskStart)
        fd.append("endDate", taskEnd)
        fd.append("color", taskColor)
        fd.append("borderColor", taskBorderColor)
        if (taskAssigneeId) {
            fd.append("assigneeId", taskAssigneeId)
        }

        if (editingTask) {
            await updateDeliveryTask(editingTask.id, fd)
        } else {
            await createDeliveryTask(fd)
        }

        setTaskModalOpen(false)
        setEditingTask(null)
        window.location.assign(window.location.pathname)
    }

    const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("Are you sure?")) return
        await deleteDeliveryTask(id)
        window.location.assign(window.location.pathname)
    }

    const openNewTaskModal = (personId: string, day: Date) => {
        setSelectedPersonId(personId)
        setTaskStart(format(day, "yyyy-MM-dd"))
        setTaskEnd(format(addDays(day, 2), "yyyy-MM-dd"))
        setTaskTitle("")
        setTaskAssigneeId("")
        setTaskColor("#6366f1")
        setTaskBorderColor("#4f46e5")
        setEditingTask(null)
        setTaskModalOpen(true)
    }

    const openEditTaskModal = (task: any, personId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedPersonId(personId)
        setTaskStart(format(new Date(task.startDate), "yyyy-MM-dd"))
        setTaskEnd(format(new Date(task.endDate), "yyyy-MM-dd"))
        setTaskTitle(task.title)
        setTaskAssigneeId(task.assigneeId || "")
        setTaskColor(task.color || "#6366f1")
        setTaskBorderColor(task.borderColor || "#4f46e5")
        setEditingTask(task)
        setTaskModalOpen(true)
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow border border-gray-200">
            {/* Header / Tools */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-wrap gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setStartDate(addDays(startDate, -7))}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                    >
                        &lt; -1 Settimana
                    </button>
                    <button
                        onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                        className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-sm hover:bg-blue-100 font-medium"
                    >
                        Oggi
                    </button>
                    <button
                        onClick={() => setStartDate(addDays(startDate, 7))}
                        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                    >
                        +1 Settimana &gt;
                    </button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <button
                        onClick={() => setPxPerDay(p => Math.min(200, p + 10))}
                        className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100 flex items-center justify-center"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                        onClick={() => setPxPerDay(p => Math.max(10, p - 10))}
                        className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100 flex items-center justify-center"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                        onClick={handleFitToScreen}
                        className="px-2 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100 flex items-center justify-center"
                        title="Adatta allo schermo"
                    >
                        <Maximize className="w-4 h-4 text-gray-700" />
                    </button>
                </div>

                <div className="flex gap-4">
                    {userRole === "ADMIN" && (
                        <button
                            onClick={() => setPersonModalOpen(true)}
                            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition"
                        >
                            <Plus className="w-4 h-4" /> Aggiungi Persona
                        </button>
                    )}
                </div>
            </div>

            {/* Gantt Container */}
            <div className="flex-1 overflow-x-auto relative" ref={scrollContainerRef}>
                <div className="min-w-max">
                    {/* Time Axis Header */}
                    <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                        {/* Person Column space */}
                        <div className="w-48 shrink-0 border-r border-gray-200 bg-gray-50 p-3 font-semibold text-gray-700 sticky left-0 z-20">
                            Risorse
                        </div>
                        {/* Days */}
                        {dates.map((day, i) => (
                            <div key={i} style={{ width: `${pxPerDay}px` }} className="shrink-0 border-r border-gray-200 p-2 text-center flex flex-col items-center justify-center overflow-hidden">
                                {pxPerDay > 40 && <span className="text-xs text-gray-500 uppercase">{format(day, "EEEEEE", { locale: it })}</span>}
                                <span className={cn("font-bold", pxPerDay > 40 ? "text-sm" : "text-xs", isSameDay(day, new Date()) ? "text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center" : "text-gray-800")}>
                                    {format(day, "d")}
                                </span>
                                {pxPerDay > 60 && <span className="text-[10px] text-gray-400">{format(day, "MMM", { locale: it })}</span>}
                            </div>
                        ))}
                    </div>

                    {/* Gantt Rows */}
                    {people.map(person => (
                        <div key={person.id} className="flex border-b border-gray-100 group hover:bg-gray-50 transition-colors">
                            {/* Person Label */}
                            <div className="w-48 shrink-0 border-r border-gray-200 bg-white p-3 sticky left-0 z-10 flex justify-between items-center group-hover:bg-gray-50 transition-colors">
                                <span className="font-medium text-sm text-gray-900 truncate" title={person.name}>{person.name}</span>
                                {userRole === "ADMIN" && (
                                    <button onClick={() => handleDeletePerson(person.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Gantt Cells & Tasks Overlay */}
                            <div className="flex relative">
                                {/* Cells for grid marks */}
                                {dates.map((day, i) => (
                                    <div
                                        key={i}
                                        onClick={() => openNewTaskModal(person.id, day)}
                                        style={{ width: `${pxPerDay}px` }}
                                        className={cn(
                                            "shrink-0 border-r border-gray-100 h-16 cursor-crosshair hover:bg-blue-50/50 transition-colors",
                                            isSameDay(day, new Date()) && "bg-blue-50/20"
                                        )}
                                    />
                                ))}

                                {/* Task Bars */}
                                {person.tasks && person.tasks.map((task: any) => {
                                    const taskStart = new Date(task.startDate)
                                    const taskEnd = new Date(task.endDate)

                                    // Calculate visible position
                                    const firstVisibleDate = dates[0]
                                    const lastVisibleDate = dates[dates.length - 1]

                                    if (taskEnd < firstVisibleDate || taskStart > lastVisibleDate) return null // Out of bounds

                                    // Start offset
                                    let leftOffset = 0
                                    let daysLength = differenceInDays(taskEnd, taskStart) + 1 // inclusive

                                    if (taskStart < firstVisibleDate) {
                                        // cut off the start
                                        const hiddenDays = differenceInDays(taskStart, firstVisibleDate) // negative
                                        daysLength += hiddenDays
                                        leftOffset = 0
                                    } else {
                                        leftOffset = differenceInDays(taskStart, firstVisibleDate) * pxPerDay
                                    }

                                    // Cap width if it goes beyond visible area
                                    const visibleDaysLeftInWindow = differenceInDays(lastVisibleDate, taskStart) + 1
                                    if (daysLength > visibleDaysLeftInWindow) {
                                        daysLength = visibleDaysLeftInWindow
                                    }

                                    const width = daysLength * pxPerDay

                                    return (
                                        <div
                                            key={task.id}
                                            onClick={(e) => openEditTaskModal(task, person.id, e)}
                                            style={{
                                                left: `${leftOffset}px`,
                                                width: `${width - (pxPerDay > 30 ? 8 : 2)}px`, // leave smaller gap if zoomed out
                                                top: '12px',
                                                height: '40px',
                                                backgroundColor: task.color || '#6366f1',
                                                borderColor: task.borderColor || '#4f46e5',
                                                borderWidth: task.borderColor ? '1px' : '0px'
                                            }}
                                            className="absolute ml-1 z-10 rounded-md shadow flex items-center px-2 cursor-pointer transition-colors group/task"
                                        >
                                            {pxPerDay > 30 && <span className="text-xs font-semibold text-white truncate w-full">{task.title}</span>}
                                            <div className="hidden group-hover/task:flex gap-1 absolute right-2 top-0 bottom-0 items-center pl-2 rounded-r-md" style={{ backgroundColor: task.color || '#6366f1' }}>
                                                <button onClick={(e) => handleDeleteTask(task.id, e)} className="text-white/80 hover:text-red-200">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {people.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Nessuna risorsa presente. {userRole === 'ADMIN' && 'Aggiungi una persona per iniziare.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isPersonModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
                        <h2 className="text-lg font-bold mb-4">Aggiungi Nuova Risorsa</h2>
                        <form onSubmit={handleCreatePerson}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                    <input
                                        autoFocus
                                        required
                                        type="text"
                                        value={personName}
                                        onChange={e => setPersonName(e.target.value)}
                                        className="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Mario Rossi"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setPersonModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                                    Annulla
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-bold mb-4">{editingTask ? 'Modifica' : 'Aggiungi'} Occupazione</h2>
                        <form onSubmit={handleTaskSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Attività / Titolo</label>
                                    <input
                                        required
                                        autoFocus
                                        type="text"
                                        value={taskTitle}
                                        onChange={e => setTaskTitle(e.target.value)}
                                        className="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Installazione Cliente X..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                                        <input
                                            required
                                            type="date"
                                            value={taskStart}
                                            onChange={e => setTaskStart(e.target.value)}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine <span className="font-normal text-xs text-blue-600">(verrà messa a scadenziario)</span></label>
                                        <input
                                            required
                                            type="date"
                                            value={taskEnd}
                                            onChange={e => setTaskEnd(e.target.value)}
                                            className="w-full border rounded-md p-2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assegna Responsabile (Opzionale)</label>
                                    <select
                                        value={taskAssigneeId}
                                        onChange={e => setTaskAssigneeId(e.target.value)}
                                        className="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">-- Nessuno --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name || (u.email && u.email.split('@')[0])}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Barra</label>
                                        <input
                                            type="color"
                                            value={taskColor}
                                            onChange={e => setTaskColor(e.target.value)}
                                            className="w-full h-10 border rounded-md p-1 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Colore Bordo</label>
                                        <input
                                            type="color"
                                            value={taskBorderColor}
                                            onChange={e => setTaskBorderColor(e.target.value)}
                                            className="w-full h-10 border rounded-md p-1 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => { setTaskModalOpen(false); setEditingTask(null); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors">
                                    Annulla
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
