import {Observable, ObservableList} from "../observable/observable.js";

// Model

const Person = ({firstName = "Vorname", lastName = "Nachname", workload = 0}) => {
  return {
    firstName,
    lastName,
    workload,
  };
}

const Entry = (saved) => {
  return {
    saved: Observable({...saved}),
    edited: Observable({...saved}),
    dirty: Observable(false),
  };
}

const Model = () => {
  const entryList = ObservableList([]);
  const selected = Observable(null);
  return {
    entryList,
    selected,
  };
}

// Controller

const Controller = (model) => {
  return {
    addRow() {
      const newEntry = Entry(Person({}));
      model.entryList.add(newEntry);

      const updateDirtyField = () => {
        for (let key in newEntry.saved.getValue()) {
          if (newEntry.saved.getValue()[key] !== newEntry.edited.getValue()[key]) {
            newEntry.dirty.setValue(true);
            return;
          }
        }
        newEntry.dirty.setValue(false);
      };

      newEntry.edited.onChange(updateDirtyField);
      newEntry.saved.onChange(updateDirtyField);
    },
    removeRow(obj) {
      model.entryList.del(obj);
      model.selected.setValue(null);
    },
    select(newSelected) {
      model.selected.setValue(newSelected);
    },
    update(newObj) {
      model.selected.getValue().entry.edited.setValue(newObj);
    },
    save() {
      model.selected.getValue().entry.saved.setValue(model.selected.getValue().entry.edited.getValue());
    },
    reset() {
      model.selected.getValue().entry.edited.setValue(model.selected.getValue().entry.saved.getValue());
    }
  }
}

// View

const view = () => {

  // Elements
  const model = Model();
  const controller = Controller(model);
  const addRowButton = document.querySelector(".add-button");
  const table = document.querySelector(".master tbody");
  const detail = document.querySelector(".detail");
  const saveButton = document.querySelector("button#save-button");
  const resetButton = document.querySelector("button#reset-button");
  const inputFields = {
    firstName: document.querySelector(".detail #firstNameInput"),
    lastName: document.querySelector(".detail #lastNameInput"),
    workload: document.querySelector(".detail #workloadInput"),
  };

  // register event listeners
  addRowButton.addEventListener('click', () => controller.addRow());
  saveButton.addEventListener('click', controller.save);
  resetButton.addEventListener('click', controller.reset);
  for (const [name, input] of Object.entries(inputFields)) {
    input.addEventListener('input', ({target: {value}}) => {
      controller.update({...model.selected.getValue().entry.edited.getValue(), [name]: value});
    });
  }

  // Listen von changes in model
  model.entryList.onAdd(entry => {
    const newRow = document.createElement('tr');

    newRow.innerHTML = `
      <td class="firstname"></td>
      <td class="lastname"></td>
      <td class="workload"></td>
      <td><button class="delete-row">Delete</button></td>
    `;
    table.appendChild(newRow);
    newRow.querySelector("button.delete-row").addEventListener('click', e => {
      e.stopPropagation();
      controller.removeRow(entry);
    })

    newRow.addEventListener('click', function () {
      for (let i = 0; i < this.parentElement.children.length; i++) {
        if (this.parentElement.children[i] === this) {
          controller.select({idx: i, entry});
          break;
        }
      }
    });

    entry.dirty.onChange(isDirty => {
      if (isDirty) newRow.classList.add('dirty')
      else newRow.classList.remove('dirty');
    });

    entry.edited.onChange(({firstName, lastName, workload}) => {
      newRow.querySelector(".firstname").innerText = firstName;
      newRow.querySelector(".lastname").innerText = lastName;
      newRow.querySelector(".workload").innerText = workload;
    })
  })

  model.entryList.onDel((_, index) => table.querySelector(`tr:nth-child(${index + 1})`).remove());

  const updateInputFields = person => {
    for (const [name, input] of Object.entries(inputFields)) input.value = person[name];
  }

  model.selected.onChange((selected) => {
    if (selected === null) {
      table.querySelectorAll('tr')?.forEach(i => i.classList.remove('selected'));
      updateInputFields(Person({}));
      detail.classList.remove('dirty');
      [saveButton, resetButton].forEach(button => button.setAttribute('disabled', ''));
      Object.values(inputFields).forEach(input => input.setAttribute('disabled', ''));
    } else {
      const {idx} = selected;
      table.querySelector(`tr:nth-child(${idx + 1})`)?.classList.add('selected');
      table.querySelectorAll(`tr:not(:nth-child(${idx + 1}))`)?.forEach(i => i.classList.remove('selected'));
      Object.values(inputFields).forEach(input => input.removeAttribute('disabled'));

      model.selected.getValue().entry.edited.onChange(updateInputFields);

      selected.entry.dirty.onChange(isDirty => {
        if (isDirty) detail.classList.add('dirty');
        else detail.classList.remove('dirty');
        [saveButton, resetButton].forEach(button => {
          if (isDirty) button.removeAttribute('disabled');
          else button.setAttribute('disabled', '');
        })
      })
    }
  })
}

view();
