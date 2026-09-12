<script lang="ts" setup>
const appConfig = useAppConfig();
</script>

<template>
    <NuxtLayout>
        <template #breadcrumb>
            <slot name="breadcrumb">
                <ItemBreadcrumb :custom-items="[...appConfig.breadcrumbPrepend, {label: 'About'}]" />
            </slot>
        </template>
        <template #header-text>
            About this register system
        </template>
        <template #default>
            <div class="about-copy">
                <aside class="home-info-box" aria-label="About this system">
                    <p>
                        This About page is about the technical system used for this register. For register process
                        management information, see the
                        <a href="https://www.linked.data.gov.au/governance">Australian Government Linked Data Working Group's Governance Page</a>.
                    </p>
                </aside>
                <p>
                    The system used for this register is <a href="https://prez.dev">Prez</a> which is an open source
                    Application Programming Interface (API) and user interface (UI) system that presents information
                    stored in <a href="https://en.wikipedia.org/wiki/Knowledge_graph">Knowledge Graphs</a> on the Internet.
                </p>
                <p>
                    For this deployment, Prez is configured to display a register of
                    <NuxtLink to="/catalogues/orgs:">Organisations</NuxtLink>, several registers of
                    <NuxtLink to="/catalogues/reg:pids/catalogues">Persistent Identifiers</NuxtLink> and to display
                    details of each item in those registers.
                </p>
                <p>
                    It also delivers machine-readable versions of each of those resources online and provides query
                    access to its whole Knowledge Graph via the
                    <a href="https://www.w3.org/TR/sparql12-protocol/">SPARQL Protocol</a> at the
                    <NuxtLink to="/sparql">SPARQL Endpoint</NuxtLink>, as well as a simple
                    <NuxtLink to="/search">search page</NuxtLink>.
                </p>
                <p>
                    In addition to these Knowledge Graph functions, this register system also deploys a web server
                    that implements the redirection rules for each PID. For example, the PID
                    <a href="https://linked.data.gov.au/def/reg-statuses">https://linked.data.gov.au/def/reg-statuses</a>
                    redirects to a simple static web page about the <em>Registry Statuses</em> vocabulary. This is
                    implemented as a couple of <a href="https://httpd.apache.org/">Apache web server</a> redirect rules
                    which are stored within the PID Knowledge Graph at
                    <NuxtLink :to="{ path: '/object', query: { iri: 'https://linked.data.gov.au/pid/def/reg-statuses' } }">/object?iri=https://linked.data.gov.au/pid/def/reg-statuses</NuxtLink>.
                </p>
                <h2 class="text-xl">PID Editing</h2>
                <p>
                    Prez is a read-only system, so this deployment of it is only to access PID information. To edit
                    the PID Knowledge Graph, e.g. register new PIDs, update redirect rules, the
                    <a href="https://kurrawong.ai/products/k-maker">K-Maker</a> tool must be used and it's accessible
                    from this system's <NuxtLink to="/">Home Page</NuxtLink> after logging in.
                </p>
            </div>
        </template>
    </NuxtLayout>
</template>
