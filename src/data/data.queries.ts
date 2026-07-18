import { type Recipe, collection } from "./data.libs";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { getList } from "./data.api";
import { type QueryCollectionUtils } from "@tanstack/query-db-collection";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGINATION = 20;

export const useSingleRecipe = (id: Recipe["id"] | null): Recipe | null => {
  const { data } = useLiveQuery(
    (q) => {
      if (!id) return null;

      return q
        .from({ x: collection })
        .where(({ x }) => eq(x.id, id))
        .findOne();
    },
    [id],
  );

  return data ?? null;
};

export const useListRecipes = (props: {
  search: string;
}): { list: (Recipe | null)[] | null; getNextPage: false | (() => void) } => {
  const { search } = props;

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery<
      { cursor?: string; more?: boolean; items: Recipe[] },
      Error,
      Recipe["id"][],
      ["recipes", "list", string],
      { cursor?: string; page?: number }
    >({
      throwOnError: true,
      queryKey: ["recipes", "list", search],
      initialPageParam: { page: 0 },

      select: (x) => {
        const inner = x.pages.map((x) => x.items).flat();

        const { writeBatch, writeUpsert } =
          collection.utils as QueryCollectionUtils<Recipe>;

        writeBatch(() => {
          for (const y of inner) {
            writeUpsert(y);
          }
        });

        return inner.map((x) => x.id);
      },

      getNextPageParam: ({ cursor, more }, allPages) => {
        if (cursor) return { cursor: cursor };
        if (more !== undefined) return { page: allPages.length };
      },

      queryFn: async ({ pageParam }) => {
        const trimmed = search?.trim();

        const response = await getList({
          params: {
            limit: PAGINATION,
            cursor: pageParam?.cursor,
            q: trimmed !== "" && trimmed.length > 1 ? trimmed : undefined,
            mode: "keyword",

            offset:
              pageParam?.page === undefined
                ? undefined
                : pageParam.page * PAGINATION,
          },
        });

        const items: Recipe[] = response.items.map((x): Recipe => {
          const current = collection.get(x.id);

          return {
            id: x.id,
            author: current?.author ?? null,
            category: x.category,
            title: x.title,
            image: x.image_url,
            ingredients: current?.ingredients ?? null,
            instructions: current?.instructions ?? null,
            times: {
              cook: x.cook_time ?? current?.times.cook ?? null,
              prep: current?.times.prep ?? null,
              total: x.total_time ?? current?.times.total ?? null,
            },
          };
        });

        return {
          cursor: response.next_cursor,
          more: response.has_more,
          items,
        };
      },
    });

  const getNextPage =
    hasNextPage && !isFetchingNextPage && !isPending ? fetchNextPage : false;

  return {
    list: data?.map((x) => collection.get(x) ?? null) ?? null,
    getNextPage,
  };
};
