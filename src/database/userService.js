import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";

export const getAllUsers = async (excludeUserId) => {
  try {
    const usersCollection = collection(db, "users");
    let userQuery = usersCollection;
    
    if (excludeUserId) {
      userQuery = query(usersCollection, where("id", "!=", excludeUserId));
    }
    
    const userSnapshot = await getDocs(userQuery);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return userList;
  } catch (error) {
    console.error("Error fetching users: ", error);
    return [];
  }
};
