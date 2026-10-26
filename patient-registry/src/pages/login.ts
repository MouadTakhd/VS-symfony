import { icon } from '../ui/icons.ts'
import { field, label } from '../ui/bits.ts'
import { validateLogin } from '../auth.ts'

const perks = [
  ['shield', 'One record per patient', 'Admissions, labs and notes stay on a single timeline.'],
  ['heart', 'Live ward occupancy', 'Beds, triage status and wait times update as staff log them.'],
  ['lock', 'Audited access', 'Every read and edit is attributed and timestamped.'],
]

export function renderLogin() {
  return `
  <div class="flex min-h-full flex-1 bg-white">

    <!-- form (Tailwind UI split-screen sign-in) -->
    <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        <div>
          <span class="flex size-10 items-center justify-center rounded-md bg-indigo-600 text-white">
            ${icon('logo', 'size-6')}
          </span>
          <h2 class="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">Sign in to your account</h2>
          <p class="mt-2 text-sm/6 text-gray-500">
            Signing in runs <span class="font-mono">validateLogin()</span> from
            <span class="font-mono">src/auth.ts</span>. Until you write it, use
            <span class="font-medium text-gray-700">Clinic SSO</span> below to get in.
          </p>
        </div>

        <div class="mt-10">
          <form data-login class="space-y-6" novalidate>
            <div>
              <label for="email" class="${label}">Work email</label>
              <div class="mt-2">
                <input id="email" name="email" type="email" autocomplete="email"
                  value="m.takhdoukhi@clinic.ma" class="${field} px-3"/>
              </div>
              <p data-error="email" class="mt-1 hidden text-sm text-red-600"></p>
            </div>

            <div>
              <label for="password" class="${label}">Password</label>
              <div class="relative mt-2">
                <input id="password" name="password" type="password" autocomplete="current-password"
                  value="clinic-demo" class="${field} pr-10 pl-3"/>
                <button type="button" data-toggle-pw
                  class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-500">
                  <span class="sr-only">Show password</span>${icon('eye', 'size-5')}
                </button>
              </div>
              <p data-error="password" class="mt-1 hidden text-sm text-red-600"></p>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex gap-3">
                <div class="flex h-6 shrink-0 items-center">
                  <input id="remember" type="checkbox" checked
                    class="size-4 rounded-sm border-gray-300 text-indigo-600 accent-indigo-600"/>
                </div>
                <label for="remember" class="block text-sm/6 text-gray-900">Remember me</label>
              </div>
              <div class="text-sm/6">
                <a href="#/login" class="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
              </div>
            </div>

            <button type="submit"
              class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6
                     font-semibold text-white shadow-xs hover:bg-indigo-500
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              Sign in
            </button>
          </form>
        </div>

        <div class="mt-10">
          <div class="relative">
            <div aria-hidden="true" class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm/6 font-medium">
              <span class="bg-white px-6 text-gray-900">Or continue with</span>
            </div>
          </div>

          <div class="mt-6">
            <a href="#/dashboard"
              class="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2
                     text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset
                     hover:bg-gray-50">
              ${icon('shield', 'size-5 text-gray-400')}Clinic SSO
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- brand panel -->
    <div class="relative hidden w-0 flex-1 bg-indigo-600 lg:block">
      <div class="absolute inset-0 opacity-10"
        style="background-image:linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px);background-size:56px 56px"></div>
      <div class="absolute inset-0 flex flex-col justify-center px-16 xl:px-24">
        <h2 class="text-3xl font-bold tracking-tight text-white xl:text-4xl">
          Every patient, on one record.
        </h2>
        <p class="mt-4 max-w-lg text-base/7 text-indigo-100">
          The registry your ward, lab and reception all write to — so the chart in front of you
          is the current one.
        </p>

        <dl class="mt-10 max-w-lg space-y-6">
          ${perks
            .map(
              ([ic, title, copy]) => `
            <div class="relative pl-9">
              <dt class="font-semibold text-white">
                ${icon(ic, 'absolute top-1 left-0 size-5 text-indigo-200')}${title}
              </dt>
              <dd class="mt-1 text-sm/6 text-indigo-100">${copy}</dd>
            </div>`,
            )
            .join('')}
        </dl>

        <dl class="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/20 pt-8">
          ${[
            ['1,284', 'patients on file'],
            ['4', 'wards connected'],
            ['99.9%', 'uptime this quarter'],
          ]
            .map(
              ([v, k]) => `<div>
                <dt class="text-2xl font-semibold tracking-tight text-white">${v}</dt>
                <dd class="mt-1 text-xs text-indigo-200">${k}</dd>
              </div>`,
            )
            .join('')}
        </dl>
      </div>
    </div>
  </div>`
}

export function wireLogin(root) {
  const form = root.querySelector('[data-login]')

  const clearErrors = () => {
    form.querySelectorAll('[data-error]').forEach((el) => {
      el.textContent = ''
      el.classList.add('hidden')
    })
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    clearErrors()

    // Untrusted input: three raw form values, nothing checked.
    const result = validateLogin({
      email: form.querySelector('#email').value,
      password: form.querySelector('#password').value,
      remember: form.querySelector('#remember').checked,
    })

    if (result.ok) {
      location.hash = '#/dashboard'
      return
    }

    for (const [name, message] of Object.entries(result.fieldErrors)) {
      const slot = form.querySelector(`[data-error="${name}"]`)
      if (slot) {
        slot.textContent = message
        slot.classList.remove('hidden')
      }
    }
  })

  const pw = root.querySelector('#password')
  const toggle = root.querySelector('[data-toggle-pw]')
  toggle.addEventListener('click', () => {
    const hidden = pw.type === 'password'
    pw.type = hidden ? 'text' : 'password'
    toggle.innerHTML =
      `<span class="sr-only">${hidden ? 'Hide' : 'Show'} password</span>` +
      icon(hidden ? 'eyeOff' : 'eye', 'size-5')
  })
}
