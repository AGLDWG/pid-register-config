<template>
    <NuxtLayout contentonly>
        <template #default>
            <div class="home-heading">
                <h1 class="home-title text-2xl">AGLDW Persistent Identifier Register</h1>
                <img class="home-heading-image" src="/pid.png" alt="Persistent identifier illustration" />
            </div>
            <div class="home-copy">
                <p>
                    This is the register of the
                    <a href="https://www.linked.data.gov.au">Australian Government Linked Data Working Group</a>'s
                    Persistent Identifiers (PIDs).
                </p>
                <div class="home-info-boxes">
                    <aside class="home-info-box" aria-label="PID information">
                        <ul class="home-info-links">
                            <li><a href="https://www.linked.data.gov.au/pids">What is a PID?</a></li>
                            <li><NuxtLink to="/about">What is the a redirection system?</NuxtLink></li>
                            <li><a href="https://www.linked.data.gov.au/governance">How do I make a PID?</a></li>
                            <li><NuxtLink to="/search">How can I access PID information?</NuxtLink></li>
                        </ul>
                    </aside>
                    <section class="home-info-box home-request-box" aria-labelledby="request-pid-heading">
                        <h2 id="request-pid-heading" class="text-xl">Request a PID</h2>
                        <p>Log in here to request a PID or <a href="#" @click.prevent>register to request</a></p>
                        <form class="home-login-form" @submit.prevent>
                            <label for="pid-username">Username</label>
                            <input id="pid-username" type="text" autocomplete="username" />
                            <label for="pid-password">Password</label>
                            <input id="pid-password" type="password" autocomplete="current-password" />
                            <div class="home-login-actions">
                                <button type="button">Log in</button>
                                <a href="#" @click.prevent>Forgot my password</a>
                            </div>
                        </form>
                    </section>
                    <aside class="home-info-box home-info-box-dark home-governance-box" aria-label="Governance and technical support">
                        <p>
                            This system is governed by the Australian Government Linked Data Working Group and its
                            technical operations are supported by the
                            <a href="https://ardc.edu.au/">Australian Research Data Commons</a>.
                        </p>
                    </aside>
                </div>
            </div>
        </template>
    </NuxtLayout>
</template>
