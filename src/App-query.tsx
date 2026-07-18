import { useState, useRef } from "react";
import { getList, getSingle, type ListRecipeResponse } from "./data";

import {
  useQuery,
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";

const PAGINATION = 20;

export const App = () => {
  const debouncing = useRef<number | null>(null);

  const [debounced, setDebounced] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<null | string>(null);

  const { data: viewing, isPending: isViewingPending } = useQuery({
    throwOnError: true,
    queryKey: ["single", selected],
    queryFn: () => getSingle({ id: selected! }),
    enabled: selected !== null,
  });

  const {
    data: list,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery<
    ListRecipeResponse,
    Error,
    InfiniteData<ListRecipeResponse>,
    ["list", string],
    { page?: number; cursor?: string }
  >({
    throwOnError: true,
    queryKey: ["list", debounced],
    initialPageParam: { page: 0 },
    getNextPageParam: ({ next_cursor, has_more }, allPages) => {
      if (next_cursor) return { cursor: next_cursor };
      if (has_more !== undefined) return { page: allPages.length };
    },

    queryFn: ({ pageParam }) => {
      const trimmed = debounced?.trim();

      return getList({
        params: {
          limit: PAGINATION,
          cursor: pageParam?.cursor,

          offset:
            pageParam?.page === undefined
              ? undefined
              : pageParam.page * PAGINATION,

          q: trimmed !== "" && trimmed.length > 1 ? trimmed : undefined,
          mode: "keyword",
        },
      });
    },
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    if (debouncing.current) clearTimeout(debouncing.current);

    debouncing.current = window.setTimeout(() => {
      setDebounced(event.target.value);
    }, 2000);
  };

  const display = list?.pages.flatMap((page) => page.items) ?? [];
  const initialViewingFromList = display.find((item) => item.id === selected);
  const isLoading = isPending || search !== debounced;
  const showPlaceholders = isLoading || isFetchingNextPage;

  return (
    <>
      <input placeholder="Search" onChange={handleSearch} />

      <ul>
        {!isLoading &&
          display.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  setSelected(item.id);
                }}
              >
                {item.title}
              </button>
            </li>
          ))}

        {showPlaceholders &&
          new Array(PAGINATION).fill(null).map((_, index) => {
            return <li key={index}>Loading...</li>;
          })}
      </ul>

      <button
        disabled={!hasNextPage || isFetchingNextPage}
        onClick={() => {
          if (hasNextPage) fetchNextPage();
        }}
      >
        {isFetchingNextPage ? "LOADING..." : "LOAD MORE"}
      </button>

      <dialog
        open={selected !== null}
        onClick={() => setSelected(null)}
        style={{ position: "fixed", top: 100 }}
      >
        <h2>{viewing?.title || initialViewingFromList?.title}</h2>

        <div style={{ display: "flex" }}>
          <div>
            <img
              src={initialViewingFromList?.image_url || viewing?.image_url}
              alt={initialViewingFromList?.title || viewing?.title}
              width={300}
              height={300}
              style={{ objectFit: "contain" }}
            />

            <dl>
              <div>
                <dt>Category</dt>
                <dd>{initialViewingFromList?.category || viewing?.category}</dd>
              </div>

              {(initialViewingFromList?.cook_time || viewing?.cook_time) && (
                <div>
                  <dt>Cook Time</dt>
                  <dd>
                    {initialViewingFromList?.cook_time || viewing?.cook_time}
                  </dd>
                </div>
              )}

     

              {(initialViewingFromList?.total_time || viewing?.total_time) && (
                <div>
                  <dt>Total Time</dt>
                  <dd>
                    {initialViewingFromList?.total_time || viewing?.total_time}
                  </dd>
                </div>
              )}

              {viewing?.prep_time && (
                <div>
                  <dt>Prep Time</dt>
                  <dd>
                    {viewing.prep_time}
                  </dd>
                </div>
              )}
                <div>
                  <dt>Cook Time</dt>
                  <dd>
                    {initialViewingFromList?.cook_time || viewing?.cook_time}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <ul style={{ width: 300 }}>
            {isViewingPending && <li>Loading...</li>}

            {viewing?.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>

          <ol style={{ width: 300 }}>
            {isViewingPending && <li>Loading...</li>}

            {viewing?.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        <button onClick={() => setSelected(null)}>Close</button>
      </dialog>
    </>
  );
};
