//trida pro polozky
//trida pro aktivni polozky
//trida pro celou stranu
//trida pro info
//trida na presouvani - DOMhelper

class Switch {
  constructor(){
    this.switchSectionsEl = document.querySelector(".switch");
    this.buttons = this.switchSectionsEl.querySelectorAll("button");
    this.projectsSection = document.getElementById("projects");
    this.bunnySection = document.getElementById("bunny-container");
    
    this.init();
  }

  showProjects(){
    this.projectsSection.hidden = false;
    this.bunnySection.style.display = "none";
  }

  showBunny(){
    this.bunnySection.style.display = "flex";
    this.projectsSection.hidden = true;
  }

  init() {
    this.buttons[0].addEventListener("click", () => {
      this.switchSectionsEl.classList.remove("active");
      this.showProjects();
    })

    this.buttons[1].addEventListener("click", () => {
      this.switchSectionsEl.classList.add("active");
      this.showBunny();
    })
  }
 
}

class DOMHelper {
  static clearEventListeners(element) {
    const clonedElement = element.cloneNode(true);
    element.replaceWith(clonedElement);
    return clonedElement;
  }

  static moveListItem(movedToSelector, movedElId) {
    const list = document.querySelector(movedToSelector);
    const element = document.getElementById(movedElId);
    list.append(element); //append presune
  }
}

class Component {
  constructor(hostElement, insertBefore = false) {
    if (hostElement) {
      this.hostElement = hostElement;
    } else {
      this.hostElement = document.body;
    }

    this.insertBefore = insertBefore;
  }

  attach() {
    this.hostElement.insertAdjacentElement(
      this.insertBefore ? "beforebegin" : "afterend",
      this.element
    );
  }

  detach() {
    if (this.element) this.element.remove();
  }
}

class Tooltip extends Component {
  constructor(closeNotifierFn, hostElement, insertBefore) {
    super(hostElement, insertBefore); //potreba nebot dedi a ma vlastni konstruktor
    this.closeNotifier = closeNotifierFn;
    this.render();

  }

  closeTooltip = () => {
    this.detach();
    this.closeNotifier();
  };

  render() {
    const tooltipElement = document.createElement("div");
    tooltipElement.className = "card";
    tooltipElement.textContent = "DUMMY!";
    tooltipElement.addEventListener("click", this.closeTooltip);
    this.element = tooltipElement;
    this.attach();
  }
}

class ProjectItem {
  hasActiveTooltip = false;

  constructor(id, updateProjectListsFunction, type) {
    this.id = id;
    this.updateProjectListsHandler = updateProjectListsFunction;
    this.projectItemEl = document.getElementById(this.id);
    this.switchButton(type);
    this.moreInfoButton();
  }


  moreInfoButton() {
    const moreInfoButton = this.projectItemEl.querySelector("button:first-of-type");
    moreInfoButton.addEventListener("click", this.showMoreInfoHandler.bind(this));
  }

  showMoreInfoHandler() {
    if (this.hasActiveTooltip) return;
    
    const tooltip = new Tooltip(() => {
      this.hasActiveTooltip = false;
    }, this.projectItemEl, false);

    tooltip.attach();
    this.hasActiveTooltip = true;
  }

  switchButton(type) {
    const projectItemEl = document.getElementById(this.id);
    let switchBtnEl = projectItemEl.querySelector("button:last-of-type");
    switchBtnEl = DOMHelper.clearEventListeners(switchBtnEl); //vycisti soucasne event listeners
    switchBtnEl.textContent = type === "active" ? "Finish" : "Activate";
    switchBtnEl.addEventListener(
      "click",
      this.updateProjectListsHandler.bind(null, this.id)
    );
  }

  update(updateProjectListsFn, type) {
    this.updateProjectListsHandler = updateProjectListsFn;
    this.switchButton(type); //aktualizujeme switch handler
  }
}

class ProjectList {
  projects = []; //zahaji se drive nez konstruktor

  constructor(type) {
    //aktivni nebo hotove projekty
    this.type = type;
    const listItems = document.querySelectorAll(`#${type}-projects li`); //ziskam list projektu
    for (const project of listItems) {
      this.projects.push(
        new ProjectItem(project.id, this.switchProject.bind(this), this.type)
      );
    }
  }

  setSwitchHandlerFunction(switchHandlerFunction) {
    this.switchHandler = switchHandlerFunction;
  }

  addProject(project) {
    this.projects.push(project);
    DOMHelper.moveListItem(`#${this.type}-projects ul`, project.id);
    project.update(this.switchProject.bind(this), this.type); //protoze vytvarime projekt i s jeho switch funkci v predchozim poli, musime jeho funkci znovu prevytvorit
  }

  switchProject(projectId) {
    this.switchHandler(this.projects.find((p) => p.id === projectId));
    this.projects = this.projects.filter((p) => p.id !== projectId);

    if (this.updateBunny) {
      this.updateBunny();
    }
  }

  setBunnyUpdateHandler(updateFn) {
    this.updateBunny = updateFn;
  }
}

class Bunny {
  status = "";

  static init(finishedProjects) {
    if (finishedProjects.length === 0) {
      console.log("Bunny is hungry!");
      console.log(finishedProjects.length);
    } else if (finishedProjects.length < 2) {
      console.log("BUNNY HUNGRY");
      console.log(finishedProjects.length);
    }
  }
}

class App {
  static init() {
    const activeProjectsList = new ProjectList("active");
    const finishedProjectsList = new ProjectList("finished");
    activeProjectsList.setSwitchHandlerFunction(
      finishedProjectsList.addProject.bind(finishedProjectsList)
    );
    finishedProjectsList.setSwitchHandlerFunction(
      activeProjectsList.addProject.bind(activeProjectsList)
    );

    const updateBunnyStatus = () => {
      Bunny.init(finishedProjectsList.projects);
    };

    finishedProjectsList.setBunnyUpdateHandler(updateBunnyStatus);
    activeProjectsList.setBunnyUpdateHandler(updateBunnyStatus);

    updateBunnyStatus();
    
    new Switch();
  }
  // static protoze ji volame jen jednou
}

App.init();
