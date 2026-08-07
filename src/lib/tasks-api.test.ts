// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { toast } from "sonner";

import { useUpdateTaskStatus, taskKeys } from "./tasks-api";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const fromMock = supabase.from as ReturnType<typeof vi.fn>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, Wrapper };
}

const baseTask = {
  id: "task-1",
  title: "Pay down tech debt",
  status: "in_progress" as const,
  completed_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(toast, "error").mockImplementation(() => undefined as never);
});

describe("useUpdateTaskStatus", () => {
  it("optimistically flips status, then rolls back when the write fails", async () => {
    const { queryClient, Wrapper } = makeWrapper();
    queryClient.setQueryData(taskKeys.tasks, [{ ...baseTask }]);

    fromMock.mockReturnValue({
      update: vi
        .fn()
        .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: new Error("network") }) }),
    });

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: Wrapper });

    result.current.mutate({ id: "task-1", status: "completed" });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isError).toBe(true);

    const tasks = queryClient.getQueryData<(typeof baseTask)[]>(taskKeys.tasks);
    expect(tasks?.[0]).toMatchObject({ id: "task-1", status: "in_progress", completed_at: null });
    expect(toast.error).toHaveBeenCalled();
  });
});
