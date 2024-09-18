import classNames from "classnames/bind";
import style from "./calendar.module.scss";

const cx = classNames.bind(style);

function Calendar() {
    return ( 
        <div className={cx('calendar')}>
            Calendar
        </div>
     );
}

export default Calendar;