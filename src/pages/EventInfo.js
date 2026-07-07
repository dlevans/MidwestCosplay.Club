import React from "react";

const STATE_NAMES = {
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", MI: "Michigan",
  MN: "Minnesota", MO: "Missouri", NE: "Nebraska", ND: "North Dakota",
  OH: "Ohio", SD: "South Dakota", WI: "Wisconsin",
};

// Parses "YYYY-MM-DD" as a local calendar date (avoids UTC off-by-one).
const parseLocalDate = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const formatDate = (value) => {
  const d = parseLocalDate(value);
  if (!d) return null;
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "long", day: "numeric" });
};

const formatTime = (value) => {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

const formatDateRange = (start, end) => {
  const startLabel = formatDate(start);
  if (!startLabel) return null;
  if (!end || end === start) return startLabel;
  const endLabel = formatDate(end);
  return endLabel ? `${startLabel} – ${endLabel}` : startLabel;
};

/*
 * EventInfo — "wikipedia style" infobox + write-up for the public event page.
 *
 * Renders whatever fields are present; every field is optional so this
 * degrades gracefully for events that haven't been fully filled out yet.
 *
 * Expected event shape (from GET /events/:id):
 *   eventname, eventcity, eventstate, eventvenue, eventaddress, eventzip,
 *   eventstartdate, eventenddate, eventstarttime, eventendtime,
 *   eventwebsite, eventdescription
 */
const EventInfo = ({ event = {} }) => {
  const {
    eventname,
    eventcity,
    eventstate,
    eventvenue,
    eventaddress,
    eventzip,
    eventstartdate,
    eventenddate,
    eventstarttime,
    eventendtime,
    eventwebsite,
    eventdescription,
  } = event;

  const dateRange = formatDateRange(eventstartdate, eventenddate);
  const timeRange = [formatTime(eventstarttime), formatTime(eventendtime)].filter(Boolean).join(" – ");
  const stateName = STATE_NAMES[eventstate] || eventstate;

  const addressParts = [eventaddress, [eventcity, eventstate].filter(Boolean).join(", "), eventzip].filter(Boolean);
  const mapsQuery = encodeURIComponent([eventvenue, eventaddress, eventcity, eventstate, eventzip].filter(Boolean).join(", "));

  const descriptionParagraphs = (eventdescription || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="event-info-section">
      <div className="event-infobox">
        <h2 className="event-infobox-title">{eventname}</h2>
        <table className="event-infobox-table">
          <tbody>
            {dateRange && (
              <tr>
                <th scope="row">Date</th>
                <td>{dateRange}{timeRange && <><br /><span className="event-infobox-subtle">{timeRange}</span></>}</td>
              </tr>
            )}
            {eventvenue && (
              <tr>
                <th scope="row">Venue</th>
                <td>{eventvenue}</td>
              </tr>
            )}
            {addressParts.length > 0 && (
              <tr>
                <th scope="row">Location</th>
                <td>
                  {addressParts.join(", ")}
                  {" "}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer">
                    (map)
                  </a>
                </td>
              </tr>
            )}
            {!eventvenue && !addressParts.length && (eventcity || stateName) && (
              <tr>
                <th scope="row">Location</th>
                <td>{[eventcity, stateName].filter(Boolean).join(", ")}</td>
              </tr>
            )}
            {eventwebsite && (
              <tr>
                <th scope="row">Website</th>
                <td>
                  <a href={eventwebsite} target="_blank" rel="noopener noreferrer">{eventwebsite}</a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {descriptionParagraphs.length > 0 && (
        <div className="event-description">
          {descriptionParagraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventInfo;