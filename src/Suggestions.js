import React from 'react'

const Suggestions = (props) => {
  const options = props.results.filter(s=> s.searchterm.toLowerCase().includes(props.query.toLowerCase().trim())).map(r => (
    <div className="item" key={r.id}>
        <li>        
        <a href={r.url+r.filename} target="_blank" rel="noopener noreferrer">
        <img alt={r.alt} src={r.thumbnail+r.filename} />
        </a>
        <span className="caption">
          {r.searchterm} <br></br>
          {r.id} <br></br>
          {r.client} <br></br>
          {r.alt} <br></br>
          </span>
        </li> 
    </div>
  ))
  return <ul>{options}</ul>
}

export default Suggestions