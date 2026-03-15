import {formatISO9075, format} from "date-fns";
import {Link} from "react-router-dom";
export default function Post({_id,title,summary,cover,createdAt,author}){
  return(
    <div className="post">
        <div className="image">
          <Link to={`/post/${_id}`}>
            <img src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${cover}`} alt={title} />

          </Link>
        </div>
        <div className="text">
          <Link to={`/post/${_id}`}>
            <h2>{title}</h2>
          </Link>
          <p className="info">
            <a className="author">{author.username}</a>
            <time dateTime={formatISO9075(new Date(createdAt))}>
            {format(new Date(createdAt), 'MMMM d, yyyy h:mm a')}
          </time>
          </p>
          <p className="summary">{summary}</p>
         </div>
       </div>
    )
}