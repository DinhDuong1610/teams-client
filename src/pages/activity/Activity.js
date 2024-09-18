import classNames from "classnames/bind";
import style from "./activity.modul.scss";

const cx = classNames.bind(style);

function Activity() {
    return ( 
        <div className={cx('activity')}>
            Activity
        </div>
     );
}

export default Activity;