const AUTH_URL = "https://functions.poehali.dev/0bf7f72f-5b6f-44c6-89c5-e9b282e6af88";
const TOOLS_URL = "https://functions.poehali.dev/6432f493-1f71-41f5-a4b3-8cffeb9727d9";
const GENERATE_URL = "https://functions.poehali.dev/2afb472b-a1f9-44b5-b6f8-161d23fe9db7";
const ADMIN_URL = "https://functions.poehali.dev/d3e977ed-2750-4f12-8b84-a9a77ced73f5";
const PAYMENTS_URL = "https://functions.poehali.dev/dc7471fd-d9dc-47aa-800e-2ea62214325d";

function getToken(): string {
  return localStorage.getItem("auth_token") || "";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok && data.error) throw new Error(data.error);
  return data as T;
}

export const authApi = {
  register: (email: string, password: string, name: string, ref_code?: string) =>
    request<{ success: boolean; user: User; token: string }>(`${AUTH_URL}/register`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email, password, name, ref_code }),
    }),

  login: (email: string, password: string) =>
    request<{ success: boolean; user: User; token: string }>(`${AUTH_URL}/login`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    request<{ user: User }>(`${AUTH_URL}/me`, {
      method: "GET",
      headers: authHeaders(),
    }),
};

export const toolsApi = {
  getCatalog: (params?: { category?: string; pricing?: string; search?: string; sort?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ tools: AiTool[] }>(`${TOOLS_URL}/catalog${qs ? "?" + qs : ""}`, {
      headers: authHeaders(),
    });
  },

  getPlans: () =>
    request<{ plans: Plan[] }>(`${TOOLS_URL}/plans`, { headers: authHeaders() }),

  checkLimit: (tool_slug: string) =>
    request<{ allowed: boolean; remaining?: number; reason?: string }>(`${TOOLS_URL}/check-limit`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tool_slug }),
    }),

  saveGeneration: (tool_slug: string, prompt: string, result_url?: string, result_data?: object) =>
    request<{ success: boolean; generation_id: number }>(`${TOOLS_URL}/save-generation`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tool_slug, prompt, result_url, result_data }),
    }),

  myGenerations: (tool_slug?: string) => {
    const qs = tool_slug ? `?tool_slug=${tool_slug}` : "";
    return request<{ generations: Generation[] }>(`${TOOLS_URL}/my-generations${qs}`, {
      headers: authHeaders(),
    });
  },
};

export const generateApi = {
  roulette: () =>
    request<{ prompt: string }>(`${GENERATE_URL}/roulette`, { headers: authHeaders() }),

  imageGen: (prompt: string, style: string) =>
    request<{ image_url: string; prompt: string }>(`${GENERATE_URL}/image-gen`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ prompt, style }),
    }),

  imageEdit: (image_base64: string, prompt: string) =>
    request<{ image_url: string; prompt: string }>(`${GENERATE_URL}/image-edit`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ image_base64, prompt }),
    }),

  post: (topic: string, platform: string, tone: string) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/post`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ topic, platform, tone }),
    }),

  scenario: (topic: string, platform: string, duration: string) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/scenario`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ topic, platform, duration }),
    }),

  contentPlan: (niche: string, period: string, goals: string) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/content-plan`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ niche, period, goals }),
    }),

  carousel: (topic: string, slides_count: number) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/carousel`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ topic, slides_count }),
    }),

  profileAnalysis: (niche: string, followers: number, avg_likes: number) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/profile-analysis`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ niche, followers, avg_likes }),
    }),

  funnel: (platform: string, product: string, audience: string) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/funnel`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ platform, product, audience }),
    }),

  presentation: (topic: string, slides_count: number) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/presentation`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ topic, slides_count }),
    }),

  guide: (topic: string, guide_type: string) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/guide`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ topic, guide_type }),
    }),

  productCard: (product_name: string, features: string, price: string) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/product-card`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ product_name, features, price }),
    }),

  reelsAnalysis: (video_description: string, views: number, likes: number, comments: number) =>
    request<{ result: string; type: string }>(`${GENERATE_URL}/reels-analysis`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ video_description, views, likes, comments }),
    }),
};

export const paymentsApi = {
  create: (plan_slug: string, single_tool_slug?: string) =>
    request<{ payment_id?: string; confirmation_url?: string; amount: number; plan_name: string; demo?: boolean; message?: string }>(
      `${PAYMENTS_URL}/create`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          plan_slug,
          single_tool_slug,
          return_url: `${window.location.origin}/pricing?payment=success`,
        }),
      }
    ),

  status: (payment_id: string) =>
    request<{ status: string; paid_at: string | null }>(
      `${PAYMENTS_URL}/status?payment_id=${payment_id}`,
      { headers: authHeaders() }
    ),

  history: () =>
    request<{ payments: PaymentRecord[] }>(`${PAYMENTS_URL}/history`, {
      headers: authHeaders(),
    }),
};

export const adminApi = {
  stats: () =>
    request<AdminStats>(`${ADMIN_URL}/stats`, { headers: authHeaders() }),

  users: (search?: string) => {
    const qs = search ? `?search=${search}` : "";
    return request<{ users: AdminUser[] }>(`${ADMIN_URL}/users${qs}`, { headers: authHeaders() });
  },

  grantAccess: (user_id: number, plan_slug: string, months: number) =>
    request<{ success: boolean }>(`${ADMIN_URL}/grant-access`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ user_id, plan_slug, months }),
    }),

  makeAdmin: (user_id: number) =>
    request<{ success: boolean }>(`${ADMIN_URL}/make-admin`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ user_id }),
    }),

  setupFounder: (email: string) =>
    request<{ success: boolean; message: string }>(`${ADMIN_URL}/setup-founder`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    }),

  generations: () =>
    request<{ generations: Generation[] }>(`${ADMIN_URL}/generations`, { headers: authHeaders() }),
};

export interface User {
  id: number;
  email: string;
  name: string;
  referral_code: string;
  is_admin: boolean;
  bonus_generations: number;
  free_image_generations: number;
  free_carousel_generations: number;
  subscription?: Subscription | null;
}

export interface Subscription {
  plan_name: string;
  plan_slug: string;
  expires_at: string | null;
  single_tool_slug: string | null;
  is_unlimited: boolean;
  generations_per_tool: number | null;
}

export interface Plan {
  id: number;
  name: string;
  slug: string;
  price: number;
  generations_per_tool: number | null;
  is_unlimited: boolean;
  duration_months: number;
  description: string;
  is_single_tool: boolean;
}

export interface AiTool {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  pricing_type: string;
  logo_url: string | null;
  website_url: string | null;
  rating: number;
  votes: number;
  is_featured: boolean;
  tags: string[];
  capabilities: string[];
}

export interface Generation {
  id: number;
  tool_slug: string;
  prompt: string;
  result_url: string | null;
  result_data: object | null;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  total_generations: number;
  total_referrals: number;
  new_users_week: number;
}

export interface PaymentRecord {
  id: number;
  plan_name: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  bonus_generations: number;
  free_image_generations: number;
  free_carousel_generations: number;
  created_at: string;
  subscription: string | null;
}