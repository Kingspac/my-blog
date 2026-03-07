import {formatISO9075, format} from "date-fns";

export default function Post({title,summary,cover,createdAt,author}){
  return(
    <div className="post">
        <div className="image">
          <img src="./logo512.png" />
        </div>
        <div className="text">
          <h2>{title}</h2>
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