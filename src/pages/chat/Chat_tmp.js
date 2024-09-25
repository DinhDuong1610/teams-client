import { useState } from "react";
import classNames from "classnames/bind";
import style from "./chat.module.scss";
import ChatBox from "./chatBox/ChatBox";
import ListUser from "./listUser/ListUser";

const cx = classNames.bind(style);

function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  return ( 
    <div className={cx('chat')}>
      <div className={cx('listUser')}>
        <ListUser onUserSelect={handleUserSelect} />
      </div>
      <div className={cx('chatBox')}>
        {selectedUser && <ChatBox user={selectedUser} />}
      </div>
    </div>
  );
}

export default Chat;
