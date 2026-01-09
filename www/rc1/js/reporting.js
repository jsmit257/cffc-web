(_ => {
  let ws = '.main>.workspace.reporting'
  let report = `${ws}>.report`
  let entity = `${report}>.entity`
  let rootndx = `${entity}>.ndx`
  let ndxrow = `${rootndx}>.row`
  let substrates = ['bulk', 'grain', 'liquid', 'plating']
    .map(v => `.entity[name="${v}_substrate"]`)
    .join(',')
  let rptitem = 'body>.menubar>.items>.reporting.selected'

  let labelmap = {
    'bulk_cost': 'Bulk cost',
    'bulk_substrate': 'Bulk',
    'count': 'Count/kg',
    'ctime': 'Created',
    'dtime': 'Deleted',
    'generation': 'Parent(s)',
    'grain_cost': 'Grain cost',
    'grain_substrate': 'Grain',
    'id': 'ID',
    'liquid_substrate': 'Liquid',
    'mtime': 'Modified',
    'plating_substrate': 'Plating',
    'strain_cost': 'Strain cost',
    'yield': 'Yield (g)',
  }

  let pluralmap = {
    'attributes': 'attribute',
    'events': 'event',
    'generations': 'generation',
    'ingredients': 'ingredient',
    'lifecycles': 'lifecycle',
    'notes': 'note',
    'photos': 'photo',
    'sources': 'source',
    'strains': 'strain',
    'substrates': 'substrate',
  }

  let sortindices = (_ => {
    let result = {
      attribute: ['id', 'name', 'value'],
      event: ['id', 'temperature', 'humidity', 'event_type', 'photos', 'notes', 'mtime', 'ctime'],
      eventtype: ['id', 'name', 'severity', 'stage', 'lifecycles', 'generations'],
      generation: ['id', 'sources', 'progeny', 'plating_substrate', 'liquid_substrate', 'events', 'notes', 'mtime', 'ctime'],
      ingredient: ['id', 'name'],
      lifecycle: ['id', 'location', 'yield', 'count', 'gross', 'strain', 'grain_substrate', 'bulk_substrate', 'events', 'notes', 'mtime', 'ctime'],
      note: ['id', 'note', 'mtime', 'ctime'],
      photo: ['id', 'image', 'notes', 'mtime', 'ctime'],
      source: ['lifecycle', 'strain', 'type'],
      stage: ['id', 'name'],
      strain: ['id', 'name', 'species', 'strain_cost', 'generation', 'attributes', 'photos', 'vendor', 'lifecycles', 'generations', 'ctime', 'dtime'],
      substrate: ['id', 'name', 'type', 'grain_cost', 'bulk_cost', 'ingredients', 'vendor', 'generations', 'lifecycles'],
      vendor: ['id', 'name', 'website', 'strains', 'substrates'],
    }

    result.progeny = result.strain
    result.grain_substrate
      = result.bulk_substrate
      = result.plating_substrate
      = result.liquid_substrate
      = result.substrate

    return result
  })()

  let fmt = (d, p = /^(\d{4}.\d\d.\d\d).(\d\d.\d\d.\d\d).*/) =>
    d.replace ? d.replace(p, '$1 $2') : d

  $(document.body)
    .on('activate', `>${ws}`, (e, _) => {
      e.stopPropagation()

      // FIXME? is this a timing issue? should it move/copy to report::fetch?
      $(`body>${report}`).trigger('fetch', $(rptitem).attr('x-report'))
    })
    .on('fetch', `>${ws}>.table.reporting`, e => {
      e.stopPropagation()

      // hack? index::activate has done its job, now turn the table into a report;
      // this has roots in legacy front-end logic, but also recursive reports don't 
      // really follow the model of a flat table beyond simply loading resources
      e.currentTarget.className = 'report'
    })
    .on('fetch', `>${report}`, (e, entityname) => {
      e.stopPropagation()

      sessionStorage.report = entityname

      e.currentTarget.className = `report ${entityname}`

      $(e.currentTarget)
        .attr({ breadcrumb: `reports/${entityname}` })
        .find('>.entity')
        .attr('name', entityname)
        .addClass('collapsed')
        .trigger('reinit', entityname)
        .find('>.ndx')
        .attr('name', entityname)
        .trigger('refresh')
    })
    .on('reinit', `>${entity}`, (e, key) => {
      e.stopPropagation()

      let $entity = $(e.currentTarget).removeAttr('dtime')
      $entity.find('>.list').empty()
      $entity.find('>.cliff-notes').html('(choose ye)')
      $entity.find('>.entity-name').html(labelmap[key] || key)
    })
    .on('refresh', `>${rootndx}`, e => {
      e.stopPropagation()

      // FIXME: get ID from sessionStorage/breadcrumb
      let id = $(e.currentTarget).breadcrumb() ?? 'x-undefined'

      let url = `${$(`body>${rootndx}`).attr('name')}s`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          message: await resp.text()
        }
        return await resp.json()
      }).then(json => $(e.currentTarget)
        .empty()
        .trigger('send', json)
        .find(`>.row#${id}`)
        .click()
      ).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('send', `>${rootndx}`, (e, ...data) => {
      e.stopPropagation()

      data.forEach(el => $('<div>')
        .addClass('row hover')
        .attr('id', el.id)
        .appendTo(e.currentTarget)
        .trigger('reduce', el)) // select is a better event name, but that's confusing
    })
    .on('reduce', `>${rootndx}[name="eventtype"]>.row`, (e, record) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('send', {
        name: record.name,
        severity: record.severity,
        stage: record.stage.name,
      })
    })
    .on('reduce', `>${rootndx}[name="generation"]>.row`, (e, record) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('send', {
        mtime: record.mtime,
        strains: (record.sources?.map(src => src.strain.name) ?? ['Not assigned']).join(' & '),
        // strains: el.sources?.map(source => source.strain.name).join(' & ') || 'Not assigned',
      })
    })
    .on('reduce', `>${rootndx}[name="lifecycle"]>.row`, (e, record) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('send', {
        mtime: record.mtime,
        location: record.location,
        tombstone: typeof record.events !== 'undefined',
      })
    })
    .on('reduce', `>${rootndx}[name="strain"]>.row`, (e, record) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('send', {
        name: record.name,
        species: record.species,
        ctime: record.ctime,
      })
    })
    .on('reduce', `>${rootndx}[name="substrate"]>.row`, (e, record) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('send', { name: record.name, vendor_name: record.vendor.name })
    })
    .on('reduce', `>${rootndx}[name="vendor"]>.row`, (e, record) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('send', { name: record.name })
    })
    .on('send', `>${ndxrow}`, (e, record) => {
      e.stopPropagation()

      $(e.currentTarget).append(Object.entries(record).map(([k, v]) => $('<div>')
        .addClass(k)
        .text(fmt(v))))
    })
    .on('click', `>${ndxrow}`, e => {
      e.stopPropagation()

      let $ndx = $(e.currentTarget.parentNode)
      let $entity = $ndx.parent()

      $entity.find('>.ndx>.selected').removeClass('selected')

      let id = $(e.currentTarget).addClass('selected').attr('id')

      let url = `reports/${$ndx.attr('name')}/${$(e.currentTarget).breadcrumb(id)}`
      fetch(url).then(async resp => {
        if (resp.status !== 200) throw {
          status: resp.status,
          message: await resp.text(),
        }
        return await resp.json()
      }).then(json => $entity
        .removeClass('collapsed')
        .find('>.list')
        .empty()
        .parent()
        .trigger('send', json)
      ).catch(ex => $(e.currentTarget).notify('error',
        `GET ${url} statusCode: ${ex.status ?? 'unsent'}`,
        ex,
      ))
    })
    .on('send', '.entity[name="attribute"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [data.name, data.value])
    })
    .on('send', '.entity[name="event"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [fmt(data.mtime), data.event_type.name])
    })
    .on('send', '.entity[name="eventtype"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).find('>.cliff-notes').text(data.name)
    })
    .on('send', '.entity[name="generation"]', (e, data) => {
      e.stopPropagation()

      let strains = []

      if (data.sources) {
        data.sources.forEach(v => strains.push(v.strain.name))
      }

      $(e.currentTarget)
        .trigger('cliff-notes', [fmt(data.mtime), strains.join(' & ') || 'Not assigned'])
    })
    .on('send', '.entity[name="ingredient"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', data.name)
    })
    .on('send', '.entity[name="lifecycle"]', (e, data) => {
      e.stopPropagation()

      let totalcost = ((data.strain.strain_cost = (data.strain_cost || 0))
        + (data.grain_substrate.grain_cost = (data.grain_cost || 0))
        + (data.bulk_substrate.bulk_cost = (data.bulk_cost || 0)))

      delete data.strain_cost
      delete data.grain_cost
      delete data.bulk_cost

      $(e.currentTarget)
        .trigger('cliff-notes', [data.strain.name, fmt(data.mtime), `$${totalcost || '~'}`])
    })
    .on('send', '.entity[name="note"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [fmt(data.mtime), `${data.note.slice(0, 25)}...`])
    })
    .on('send', '.entity[name="photo"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', fmt(data.mtime))

      data.image = `<a href=/album/${data.image} target=_lobby>${data.image}</a>`
    })
    .on('send', '.entity[name="source"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [data.type, data.strain.name])
    })
    .on('send', '.entity[name="stage"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [data.name])
    })
    .on('send', '.entity[name="strain"], .entity[name="progeny"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget)
        .removeAttr('dtime')
        .attr('dtime', data.dtime)
        .trigger('cliff-notes', [
          data.name,
          data.species,
          data.vendor.name,
          `$${data.strain_cost || '~'}`,
        ])

      // delete data.strain_cost
    })
    .on('send', substrates, (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [
        data.name, data.vendor.name,
        `$${data.grain_cost || data.bulk_cost || '~'}`
      ])

      // delete data.grain_cost
      // delete data.strain_cost
    })
    .on('send', '.entity[name="substrate"]', (e, data) => {
      $(e.currentTarget).trigger('cliff-notes', [data.name, data.vendor.name])
    })
    .on('send', '.entity[name="vendor"]', (e, data) => {
      e.stopPropagation()

      data.website = `<a href=${data.website} target=_macondo>${data.website}</a>`

      $(e.currentTarget).trigger('cliff-notes', data.name)
    })
    .on('send', '.entity', (e, data) => {
      e.stopPropagation()

      Object.entries(data).forEach((entry) => $(e.currentTarget)
        .find('>.list')
        .trigger('parse-data', entry))

      // // begs the question whether id is ever used
      // $(e.currentTarget).attr('id', data?.id).trigger('sort')
      $(e.currentTarget).trigger('sort')
    })
    .on('parse-data', '.list', (e, key, val) => {
      e.stopPropagation()

      switch (val.constructor.prototype) {
        case Object.prototype:
          $(e.currentTarget).trigger('new-entity', [key, val])
          break

        case Array.prototype:
          let $list = $(e.currentTarget)
            .trigger('new-entity', [key, {}, val.length])
            .find('>.entity:last-child>.list')
          val.forEach(v => $list.trigger('new-entity', [pluralmap[key] ?? key, v]))
          break

        default: $('<div>')
          .addClass(`scalar`)
          .attr('sort-key', key)
          .append($('<div>').addClass('label').html(labelmap[key] || key))
          .append($('<div>').addClass('value').html(fmt(val)))
          .appendTo(e.currentTarget)
      }
    })
    .on('new-entity', '.list', (e, key, val, summary) => {
      e.stopPropagation()

      $('<div>')
        .addClass('entity collapsed')
        .attr({
          name: key,
          'sort-key': key,
        })
        .append($('<div>').addClass('entity-name').html(labelmap[key] || key))
        .append($('<div>').addClass('cliff-notes').text(summary))
        .append($('<div>').addClass('list'))
        .appendTo(e.currentTarget)
        .trigger('send', val)
    })
    .on('sort', '.entity', e => {
      e.stopPropagation()

      let ndx = sortindices[$(e.currentTarget).attr('name')]
      if (!ndx) {
        return
      }

      let $list = $(e.currentTarget).find('>.list');
      $list.append(...$list.children().sort((a, b) =>
        ndx.indexOf(a.getAttribute('sort-key')) - ndx.indexOf(b.getAttribute('sort-key'))))
    })
    .on('cliff-notes', '.entity', (e, ...data) => {
      e.stopPropagation()

      let $cliff = $(e.currentTarget)
        .find('>.cliff-notes')
        .empty()

      data.forEach(v => $cliff.append($('<div>').text(v)))
    })
    .on('click', '.entity-name, .cliff-notes', (e, data) => {
      e.stopPropagation()

      let $e = $(e.currentTarget)
        .parents('.entity')
        .first()

      if (e.ctrlKey) {
        $e.find('.entity')[$e.hasClass('collapsed') ? 'addClass' : 'removeClass']('collapsed')
      } else {
        $e.toggleClass('collapsed')
      }
    })
})()