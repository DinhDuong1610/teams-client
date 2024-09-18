import classNames from "classnames/bind";
import style from "./Sidebar.module.scss";

import { useNavigate } from "react-router-dom";

const cx = classNames.bind(style);

function Sidebar() {
    const navigate = useNavigate();

    return ( 

        <div className={cx('sidebar')}>
            <button className={cx('btn-active')} onClick={() => navigate('/activity')}><i class="fa-solid fa-bell"></i></button>
            <button className={cx('btn-community')} onClick={() => navigate('/')}><i class="fa-solid fa-house-user"></i></button>
            <button className={cx('btn-chat')} onClick={() => navigate('/chat')}><i class="fa-brands fa-facebook-messenger"></i></button>
            <button className={cx('btn-calendar')} onClick={() => navigate('/calendar')}><i class="fa-solid fa-calendar-days"></i></button>
        </div>
     );
}

export default Sidebar;