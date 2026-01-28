export const flags = {
    // Dashboard reskin feature flag
    // Enable by setting NEXT_PUBLIC_DASHBOARD_RESKIN=true in .env
    dashboardReskin: process.env.NEXT_PUBLIC_DASHBOARD_RESKIN === 'true',
};
