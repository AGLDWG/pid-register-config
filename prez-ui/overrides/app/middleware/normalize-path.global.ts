export default defineNuxtRouteMiddleware((to) => {
    // Prez API endpoints have no trailing slash. Preserve the IRI and other query
    // parameters while normalizing the page path before its data request starts.
    const path = to.path.replace(/\/+$/, "") || "/";
    if (path !== to.path) {
        return navigateTo({ path, query: to.query, hash: to.hash }, { replace: true });
    }
});
