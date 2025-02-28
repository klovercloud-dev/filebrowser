import { fetchURL, removePrefix } from './utils'
import { baseURL } from '@/utils/constants'
import store from '@/store'

export async function fetch (url) {
  url = removePrefix(url)

  const res = await fetchURL(`/api/resources${url}`, {})

  if (res.status === 200) {
    let data = await res.json()
    data.url = `/files${url}`

    if (data.isDir) {
      if (!data.url.endsWith('/')) data.url += '/'
      data.items = data.items.map((item, index) => {
        item.index = index
        item.url = `${data.url}${encodeURIComponent(item.name)}`

        if (item.isDir) {
          item.url += '/'
        }

        return item
      })
    }

    return data
  } else {
    throw new Error(res.status)
  }
}

export async function extract (url) {
  url = removePrefix(url)
  const res = await fetchURL(`/api/unzip${url}`, {})
  if (res.status === 200) {
    return "Operation Successful"
  } else {
    if(res.status==403) {
      throw new Error("Permission Denied!!")
    } else {
      throw new Error(res.status)
    }

  }
}

async function resourceAction (url, method, content) {
  url = removePrefix(url)

  let opts = { method }

  if (content) {
    opts.body = content
  }

  const res = await fetchURL(`/api/resources${url}`, opts)

  if (res.status !== 200) {
    throw new Error(await res.text())
  } else {
    return res
  }
}

export async function remove (url) {
  return resourceAction(url, 'DELETE')
}

export async function put (url, content = '') {
  return resourceAction(url, 'PUT', content)
}

export function unzip (format, ...files) {
  let url = `${baseURL}/api/unzip`

  if (files.length === 1) {
    url += removePrefix(files[0]) + '?'
  } else {
    let arg = ''

    for (let file of files) {
      arg += removePrefix(file) + ','
    }

    arg = arg.substring(0, arg.length - 1)
    arg = encodeURIComponent(arg)
    url += `/?files=${arg}&`
  }

  if (format !== null) {
    url += `algo=${format}&`
  }

  url += `auth=${store.state.jwt}`
  window.open(url)
}

export function download (format, ...files) {
  let url = `${baseURL}/api/raw`

  if (files.length === 1) {
    url += removePrefix(files[0]) + '?'
  } else {
    let arg = ''

    for (let file of files) {
      arg += removePrefix(file) + ','
    }

    arg = arg.substring(0, arg.length - 1)
    arg = encodeURIComponent(arg)
    url += `/?files=${arg}&`
  }

  if (format !== null) {
    url += `algo=${format}&`
  }

  url += `auth=${store.state.jwt}`
  window.open(url)
}

export async function post (url, content = '', overwrite = false, onupload) {
  url = removePrefix(url)

  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest()
    request.open('POST', `${baseURL}/api/resources${url}?override=${overwrite}`, true)
    request.setRequestHeader('X-Auth', store.state.jwt)

    if (typeof onupload === 'function') {
      request.upload.onprogress = onupload
    }

    request.onload = () => {
      if (request.status === 200) {
        resolve(request.responseText)
      } else if (request.status === 409) {
        reject(request.status)
      } else {
        reject(request.responseText)
      }
    }

    request.onerror = (error) => {
      reject(error)
    }

    request.send(content)
  })
}

function moveCopy (items, copy = false, overwrite = false, rename = false) {
  let promises = []

  for (let item of items) {
    const from = removePrefix(item.from)
    const to = encodeURIComponent(removePrefix(item.to))
    const url = `${from}?action=${copy ? 'copy' : 'rename'}&destination=${to}&override=${overwrite}&rename=${rename}`
    promises.push(resourceAction(url, 'PATCH'))
  }

  return Promise.all(promises)
}

export function move (items, overwrite = false, rename = false) {
  return moveCopy(items, false, overwrite, rename)
}

export function copy (items, overwrite = false, rename = false) {
  return moveCopy(items, true, overwrite, rename)
}

export async function checksum (url, algo) {
  const data = await resourceAction(`${url}?checksum=${algo}`, 'GET')
  return (await data.json()).checksums[algo]
}
