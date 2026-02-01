import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // =========================
  // Get users for sidebar
  // =========================
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");

      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // Get messages for selected user
  // =========================
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // Send message
  // =========================
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;

    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        // Optimistic UI update
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // =========================
  // Socket: receive messages
  // =========================
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // If message belongs to currently open chat
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        setMessages((prev) => [
          ...prev,
          { ...newMessage, seen: true },
        ]);

        // Mark as seen in backend
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        // Increase unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]:
            (prev[newMessage.senderId] || 0) + 1,
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser, axios]);

  // =========================
  // Clear unseen messages when chat opens
  // =========================
  useEffect(() => {
    if (!selectedUser) return;

    setUnseenMessages((prev) => {
      const updated = { ...prev };
      delete updated[selectedUser._id];
      return updated;
    });
  }, [selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    unseenMessages,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
