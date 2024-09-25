import classNames from "classnames/bind";
import style from "./app.module.scss";
import { Route, Routes, BrowserRouter } from "react-router-dom";

import Activity from '../src/pages/activity/Activity.js';
import Community from '../src/pages/community/Community.js';
import Chat from '../src/pages/chat/Chat.js';
import Login from '../src/pages/login/Login.js';
import Calendar from '../src/pages/calendar/Calendar.js';
import Sidebar from '../src/components/sidebar/Sidebar.js';

const cx = classNames.bind(style);


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <div className={cx('sidebar')}><Sidebar /></div>
        <div className={cx('content')}>
            <Routes>
              <Route path="/activity" element={<Activity />} />
              <Route path="/community" element={<Community />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/" element={<Login />} />
            </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
