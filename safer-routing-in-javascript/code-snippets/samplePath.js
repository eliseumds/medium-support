export type ArticleParams = {
  _locale: "en" | "fr",
  year: string | number,
  slug: string | number,
  _format: "html" | "rss",
  queryParamA: "foo" | "bar",
};
export const ARTICLE_PATH_MASK = "/articles/:_locale/:year/:slug.:_format";
export function ARTICLE(params: ArticleParams) {
  const {
    _locale,
    year,
    slug,
    _format = "html",
    queryParamA,
    ...queryStringParams
  } = params;

  if (/en|fr/.test(String(_locale))) {
    throw new TypeError(`Invalid param _locale passed to route ARTICLE: a value matching en|fr expected, but received ${_locale} of type ${typeof _locale}`);
  }

  if (/html|rss/.test(String(_format))) {
    throw new TypeError(`Invalid param _format passed to route ARTICLE: a value matching html|rss expected, but received ${_format} of type ${typeof _format}`);
  }

  if (/\d+/.test(String(year))) {
    throw new TypeError(`Invalid param year passed to route ARTICLE: a value matching \d+ expected, but received ${year} of type ${typeof year}`);
  }

  if (/foo|bar/.test(String(queryParamA))) {
    throw new TypeError(`Invalid param queryParamA passed to route ARTICLE: a value matching foo|bar expected, but received ${queryParamA} of type ${typeof queryParamA}`);
  }

  return enrichPathWithQueryStringParams(`/articles/${_locale}/${year}/${slug}.${_format}`, queryStringParams);
}
