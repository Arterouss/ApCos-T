// Backward compatibility redirecting Fapello service calls to Coomer
import { getCoomerCreators, getCoomerCreatorPosts } from "./coomerService";

export const getFapelloList = async (page = 1, search = "", sort = "trending") => {
  const data = await getCoomerCreators(page, "", search, 40);
  return (data.creators || []).map(c => ({
    name: c.name,
    slug: `${c.service}/${c.id}`,
    cover_url: c.avatar,
    followers: `${c.favorited?.toLocaleString() || 0} Favorites`,
  }));
};

export const getFapelloModel = async (slug) => {
  const parts = slug.split("/");
  const service = parts.length > 1 ? parts[0] : "onlyfans";
  const id = parts.length > 1 ? parts[1] : parts[0];

  const data = await getCoomerCreatorPosts(service, id, 0);
  const mediaList = (data.posts || []).flatMap((p) =>
    (p.images || []).map((img) => ({
      id: img.name || img.url,
      type: "image",
      src: img.url,
      cover_url: img.url,
      href: p.post_url || img.url,
      is_video: false,
    }))
  );

  return {
    name: id,
    avatar: `/api/coomer/media?icon=1&service=${encodeURIComponent(service)}&id=${encodeURIComponent(id)}`,
    followers: "Verified",
    posts: mediaList,
    media: mediaList,
  };
};
