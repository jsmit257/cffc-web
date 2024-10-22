$(_ => {
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
  }

  let format = (p => {
    return (d) => {
      if (!d.replace) {
        return d
      }
      return d.replace(p, '$1 $2')
    }
  })(/^(\d{4}.\d\d.\d\d).(\d\d.\d\d.\d\d).*/)

  let cloneentity = ($tmpl => {
    $tmpl.find('>.ndx').remove()

    return name => $tmpl
      .clone(true, true)
      .attr('name', name)
      .attr('sort-key', name)
  })($('.workspace>.history>.entity').clone(true, true))

  let newentity = ((entityname, data, $parent) => {
    // return $parent.trigger('add-child', entityname)
    //   .find('>.list>div')
    //   .last()
    //   .trigger('send', data)
    //   .find('>.entity-name')
    //   .trigger('map', entityname)
    //   .parent()
    return cloneentity(entityname)
      .appendTo($parent)
      .trigger('send', data)
      .find('>.entity-name')
      .trigger('map', entityname)
      .parent()
  })

  let parsedata = (k, data, $parent) => {
    switch (data[k].constructor.prototype) {
      case Object.prototype:
        newentity(k, data[k], $parent.find('>.list'))
        break

      case Array.prototype:
        let $list = newentity(k, [], $parent.find('>.list'))
          .removeClass('collapsed')
          .find('>.list')

        $list.prev().text(`(${data[k].length})`)

        data[k].forEach(v => {
          newentity(pluralmap[k] || k, v, $list)
        })

        break

      default:
        let $row = $('<div>')
          .addClass(`scalar`)
          .attr('sort-key', k)
          .append($('<div>')
            .addClass('label'))
          .append($('<div>')
            .addClass('value')
            .html(format(data[k])))
          .appendTo($parent.find('>.list'))
          .find('>.label')
          .trigger('map', k)
          .parent()
    }
  }

  $('.main>.workspace>.history')
    .on('activate', (e, id) => {
      let entityname = $('.main>.header>.menuitem.selecting').attr('entity-name')

      $(e.currentTarget)
        .attr('name', entityname)
        .find('>.entity')
        .attr('name', entityname)
        .addClass('collapsed')
        .trigger('reinit')
        .find('>.ndx')
        .trigger('refresh', id)
        .parent()
        .find('>.entity-name')
        .trigger('map', entityname)
    })
    .on('refresh', '>.entity>.ndx', (e, id) => {
      e.stopPropagation()

      if (id.constructor.prototype !== String.prototype) {
        id = 'x-undefined'
      }

      $.ajax({
        url: `/${$(e.delegateTarget).attr('name')}s`,
        method: 'GET',
        async: true,
        success: (data, status, xhr) => {
          $(e.currentTarget)
            .empty()
            .trigger('send', data)
            .find(`>.row#${id}`)
            .click()
        },
        error: console.log,
      })
    })
    .on('send', '>.entity[name="eventtype"]>.ndx', (e, ...data) => {
      e.stopPropagation()

      data.forEach(ev => {
        $('<div>')
          .addClass('row hover')
          .attr('id', ev.id)
          .appendTo(e.currentTarget)
          .trigger('send', {
            name: ev.name,
            severity: ev.severity,
            stage: ev.stage.name,
          })
      })
    })
    .on('send', '>.entity[name="generation"]>.ndx', (e, ...data) => {
      e.stopPropagation()

      data.forEach(gen => {
        let strains = []
        gen.sources ||= []
        gen.sources.forEach(v => {
          strains.push(v.strain.name)
        })

        $('<div>')
          .addClass('row hover')
          .attr('id', gen.id)
          .data('url', `/reports/generation/${gen.id}`)
          .appendTo(e.currentTarget)
          .trigger('send', {
            mtime: gen.mtime,
            strains: strains.join(' & ') || 'Not assigned',
          })
      })
    })
    .on('send', '>.entity[name="lifecycle"]>.ndx', (e, ...data) => {
      e.stopPropagation()

      data.forEach(lc => {
        $('<div>')
          .addClass('row hover')
          .attr('id', lc.id)
          .data('url', `/reports/lifecycle/${lc.id}`)
          .appendTo(e.currentTarget)
          .trigger('send', {
            mtime: lc.mtime,
            location: lc.location,
            tombstone: typeof lc.events !== 'undefined',
          })
      })
    })
    .on('send', '>.entity[name="strain"]>.ndx', (e, ...data) => {
      e.stopPropagation()

      data.forEach(strain => {
        $('<div>')
          .addClass('row hover')
          .attr({ id: strain.id, dtime: strain.dtime })
          .data('url', `/reports/strain/${strain.id}`)
          .appendTo(e.currentTarget)
          .trigger('send', {
            name: strain.name,
            species: strain.species,
            ctime: strain.ctime,
          })
      })
    })
    .on('send', '>.entity[name="substrate"]>.ndx', (e, ...data) => {
      e.stopPropagation()

      data.forEach(sub => {
        $('<div>')
          .addClass('row hover')
          .attr('id', sub.id)
          .data('url', `/reports/substrate/${sub.id}`)
          .appendTo(e.currentTarget)
          .trigger('send', { name: sub.name, vendor_name: sub.vendor.name })
      })
    })
    .on('send', '>.entity[name="vendor"]>.ndx', (e, ...data) => {
      e.stopPropagation()

      data.forEach(ven => {
        $('<div>')
          .addClass('row hover')
          .attr({ id: ven.id })
          .appendTo(e.currentTarget)
          .trigger('send', { name: ven.name })
      })
    })
    .on('send', '>.entity>.ndx>.row', (e, data) => {
      e.stopPropagation()

      for (let el in data) {
        if (Object.prototype.hasOwnProperty.call(data, el)) {
          $('<div>')
            .addClass(el)
            .appendTo(e.currentTarget)
            .text(format(data[el]))
        }
      }
    })
    .on('click', '>.entity>.ndx>.row', (e, parent) => {
      e.stopPropagation()

      let entityname = $(e.delegateTarget).attr('name')
      let $entity = $(e.currentTarget)
        .parents('.entity')
        .first()

      $entity.find('>.ndx>.selected').removeClass('selected')

      let $row = $(e.currentTarget).addClass('selected')

      $.ajax({
        url: $row.data('url') || `/${entityname}/${$row.attr('id')}`,
        method: 'GET',
        async: true,
        success: data => {
          $entity
            .removeClass('collapsed')
            .find('>.list')
            .empty()
            .parent()
            .trigger('send', data)
            .trigger('sort')
        },
        error: console.log,
      })
    })
    .on('send', '.entity[name="attribute"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [data.name, data.value])
    })
    .on('send', '.entity[name="event"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [format(data.mtime), data.event_type.name])
    })
    .on('send', '.entity[name="event_type"]', (e, data) => {
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
        .trigger('cliff-notes', [format(data.mtime), strains.join(' & ') || 'Not assigned'])
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
        .trigger('cliff-notes', [data.strain.name, format(data.mtime), `$${totalcost || '~'}`])
    })
    .on('send', '.entity[name="note"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', [format(data.mtime), `${data.note.slice(0, 25)}...`])
    })
    .on('send', '.entity[name="photo"]', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).trigger('cliff-notes', format(data.mtime))

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
    .on('send', '.entity[name="vendor"]', (e, data) => {
      e.stopPropagation()

      data.website = `<a href=${data.website} target=_macondo>${data.website}</a>`

      $(e.currentTarget).trigger('cliff-notes', data.name)
    })
    .on('send', ['.entity[name="plating', 'liquid', 'grain', 'bulk_substrate"]'].join('_substrate"], .entity[name="'), (e, data) => {
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
    .on('send', '.entity', (e, data) => {
      e.stopPropagation()

      $(e.currentTarget).attr('id', (data || {}).id)

      for (let el in data) {
        if (Object.prototype.hasOwnProperty.call(data, el)) {
          parsedata(el, data, $(e.currentTarget))
        }
      }

      $(e.currentTarget).trigger('sort')
    })
    .on('sort', '.entity', e => {
      e.stopPropagation()

      let ndx = sortindices[$(e.currentTarget).attr('name')]
      if (!ndx) {
        return
      }

      let $list = $(e.currentTarget).find('>.list');
      $list
        .append(...$list
          .children()
          .sort((a, b) => ndx.indexOf(a.getAttribute('sort-key')) - ndx.indexOf(b.getAttribute('sort-key'))))
    })
    .on('cliff-notes', '.entity', (e, ...data) => {
      e.stopPropagation()

      let $cliff = $(e.currentTarget)
        .find('>.cliff-notes')
        .empty()

      data.forEach(v => $cliff.append($('<div>').text(v)))
    })
    .on('reinit', '>.entity', e => $(e.currentTarget)
      .removeAttr('dtime')
      .find('>.list')
      .empty()
      .parent()
      .find('>.cliff-notes')
      .html('(choose ye)'))
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
    .on('map', '.label, .entity-name', (e, key) => {
      $(e.currentTarget).html(labelmap[key] || key)
    })

  let sortindices = (_ => {
    let result = {
      attribute: ['id', 'name', 'value'],
      event: ['id', 'temperature', 'humidity', 'event_type', 'photos', 'notes', 'mtime', 'ctime'],
      event_type: ['id', 'name', 'severity', 'stage'],
      generation: ['id', 'sources', 'progeny', 'plating_substrate', 'liquid_substrate', 'events', 'notes', 'mtime', 'ctime'],
      ingredient: ['id', 'name'],
      lifecycle: ['id', 'location', 'yield', 'count', 'strain', 'grain_substrate', 'bulk_substrate', 'events', 'notes', 'mtime', 'ctime'],
      note: ['id', 'note', 'mtime', 'ctime'],
      photo: ['id', 'image', 'notes', 'mtime', 'ctime'],
      // source: [],
      stage: ['id', 'name'],
      strain: ['id', 'name', 'species', 'strain_cost', 'generation', 'attributes', 'photos', 'vendor', 'lifecycles', 'generations', 'ctime', 'dtime'],
      vendor: ['id', 'name', 'website'],
    }

    result.progeny = result.strain
    result.grain_substrate
      = result.bulk_substrate
      = result.plating_substrate
      = result.liquid_substrate
      = ['id', 'name', 'type', 'grain_cost', 'bulk_cost', 'ingredients', 'vendor']

    return result
  })()
})