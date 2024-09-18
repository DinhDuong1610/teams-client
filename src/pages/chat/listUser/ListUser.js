import { useEffect, useState } from "react";
import { getAllUsers } from "../../../database/userService";
import { auth, db } from "../../../database/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import classNames from "classnames/bind";
import style from "./listUser.module.scss";

const cx = classNames.bind(style);

function ListUser({ onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const currentUserId = auth.currentUser?.uid;
        const userList = await getAllUsers(currentUserId);
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserClick = async (recipient) => {
    try {
      const currentUserId = auth.currentUser?.uid;
      
      const chatQuery = query(
        collection(db, "chat_box"),
        where("user1", "in", [currentUserId, recipient.id]),
        where("user2", "in", [currentUserId, recipient.id])
      );
      const querySnapshot = await getDocs(chatQuery);

      if (querySnapshot.empty) {
        await addDoc(collection(db, "chat_box"), {
          user1: currentUserId,
          user2: recipient.id,
          created_at: serverTimestamp(),
          updated: serverTimestamp()
        });

      } else {
        console.log("Chat already exists");
      }
      
      onUserSelect(recipient);
    } catch (error) {
      console.error("Error creating chat: ", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={cx('listUser')}>
      <h2>Users List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id} onClick={() => handleUserClick(user)}>
            <img src={user.avatar || "./avatar.png"} alt={user.username} />
            <div className={cx('username')}>{user.username}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListUser;
