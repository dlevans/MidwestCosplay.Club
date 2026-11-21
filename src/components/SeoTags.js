import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://midwestcosplay.club";

// Private, account, admin, and form pages that should never appear in search results.
const NOINDEX_PREFIXES = [
  "/admin",
  "/login",
  "/createuser",
  "/forgotpassword",
  "/resetpassword",
  "/update",
  "/managegroup",
  "/manageevent",
  "/addtutorial",
  "/addtemplate",
  "/addstore",
  "/protected",
  "/search",
];

// Paths containing user-generated IDs/usernames keep their original casing.
const CASE_SENSITIVE_PREFIXES = ["/public/"];

const SeoTags = () => {
  const { pathname } = useLocation();

  let path = pathname.replace(/\/+$/, "") || "/";
  const lower = path.toLowerCase();
  if (!CASE_SENSITIVE_PREFIXES.some((p) => lower.startsWith(p))) path = lower;

  const noindex = NOINDEX_PREFIXES.some((p) => lower === p || lower.startsWith(p + "/"));
  const url = SITE_URL + (path === "/" ? "/" : path);

  return (
    <Helmet>
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}
    </Helmet>
  );
};

export default SeoTags;
