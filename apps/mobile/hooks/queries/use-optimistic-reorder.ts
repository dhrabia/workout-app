import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

// Shared by every drag-to-reorder mutation (plans, days, exercises): write the
// new order into the cache immediately so the drag doesn't visually snap
// back while the request is in flight, then roll back on failure.
export function useOptimisticReorder<T>(queryKey: QueryKey, reorder: (items: T[]) => Promise<void>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorder,
    onMutate: async (reordered: T[]) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData(queryKey, reordered);
      return { previous };
    },
    onError: (_error, _reordered, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
