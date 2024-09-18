import classNames from "classnames/bind";
import style from "./community.scss";

const cx = classNames.bind(style);

function community() {
    return ( 
        <div className={cx('community')}>
            Community
        </div>
     );
}

export default community;