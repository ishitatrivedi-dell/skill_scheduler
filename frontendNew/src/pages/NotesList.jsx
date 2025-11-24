import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "https://skill-scheduler.onrender.com/api/notes";

const NoteList = () => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: "", content: "", tags: "" });
    const [editingNote, setEditingNote] = useState(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            fetchNotes();
        };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        fetchNotes();
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const fetchNotes = async () => {
        if (!navigator.onLine) {
            setIsOffline(true);
            return;
        }
        try {
            const response = await axios.get(API_URL);
            console.log("Fetched notes:", response.data);
            setNotes(response.data);
        } catch (error) {
            console.error("Error fetching notes:", error);
            toast.error("Failed to fetch notes.");
        }
    };

    const addNote = async () => {
        if (!newNote.title || !newNote.content) {
            toast.error("Title and content are required!");
            return;
        }
        if (!navigator.onLine) {
            setIsOffline(true);
            toast.error("You are offline. Cannot add note.");
            return;
        }
        try {
            const response = await axios.post(API_URL, {
                ...newNote,
                lastEdited: new Date(),
                tags: newNote.tags.split(",").map((tag) => tag.trim()).filter(tag => tag),
            });
            await fetchNotes();
            setNewNote({ title: "", content: "", tags: "" });
            toast.success("Note added successfully!");
        } catch (error) {
            console.error("Error adding note:", error);
            toast.error("Failed to add note.");
        }
    };

    const updateNote = async () => {
        if (!editingNote.title || !editingNote.content) {
            toast.error("Title and content are required!");
            return;
        }
        if (!navigator.onLine) {
            setIsOffline(true);
            toast.error("You are offline. Cannot update note.");
            return;
        }
        try {
            await axios.put(`${API_URL}/${editingNote._id}`, {
                ...editingNote,
                lastEdited: new Date(),
                tags: editingNote.tags || [],
            });
            await fetchNotes();
            setEditingNote(null);
            toast.success("Note updated successfully!");
        } catch (error) {
            console.error("Error updating note:", error);
            toast.error("Failed to update note.");
        }
    };

    const deleteNote = async (id) => {
        if (!navigator.onLine) {
            setIsOffline(true);
            toast.error("You are offline. Cannot delete note.");
            return;
        }
        try {
            await axios.delete(`${API_URL}/${id}`);
            await fetchNotes();
            toast.success("Note deleted successfully!");
        } catch (error) {
            console.error("Error deleting note:", error);
            toast.error("Failed to delete note.");
        }
    };

    return (
        <div className="flex bg-gray-100 w-screen h-[calc(100vh-64px)] mt-[64px] overflow-y-auto">
            <ToastContainer />
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 px-4 animate-slide-up">
                    <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
                </div>
                {isOffline && (
                    <div className="mx-4 mb-4 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                        You are offline. Some actions are unavailable.
                    </div>
                )}
                <div className="bg-white p-4 rounded-lg shadow-md mx-4 mb-6 transform transition-all hover:shadow-lg animate-fade-in">
                    <h2 className="text-lg font-semibold mb-2">Add New Note</h2>
                    <input
                        type="text"
                        placeholder="Title"
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-black transition-all"
                    />
                    <textarea
                        placeholder="Content"
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-black transition-all"
                    />
                    <input
                        type="text"
                        placeholder="Tags (comma-separated)"
                        value={newNote.tags}
                        onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-black transition-all"
                    />
                    <button
                        onClick={addNote}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Add Note
                    </button>
                </div>

                <div className="space-y-4">
                    {notes.map((note) => (
                        <div
                            key={note._id}
                            className="bg-white p-6 rounded-lg shadow-sm mx-4 transform transition-all hover:scale-102 hover:shadow-lg animate-fade-in delay-100"
                        >
                            {editingNote?._id === note._id ? (
                                <div>
                                    <input
                                        type="text"
                                        value={editingNote.title}
                                        onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                                        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-black"
                                    />
                                    <textarea
                                        value={editingNote.content}
                                        onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                                        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-black"
                                    />
                                    <input
                                        type="text"
                                        value={editingNote.tags?.join(", ") || ""}
                                        onChange={(e) =>
                                            setEditingNote({
                                                ...editingNote,
                                                tags: e.target.value.split(",").map((tag) => tag.trim()).filter(tag => tag),
                                            })
                                        }
                                        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-black"
                                    />
                                    <button
                                        onClick={updateNote}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg mr-2 hover:bg-green-700 transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingNote(null)}
                                        className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <h2 className="text-xl font-semibold text-gray-900">{note.title}</h2>
                                        <div className="flex gap-2">
                                            <button
                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                                onClick={() => setEditingNote(note)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => deleteNote(note._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mb-4">{note.content}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            {note.tags?.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-100 text-sm text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NoteList;