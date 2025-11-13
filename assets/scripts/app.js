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
      this.buttons[0].style.color = "white";
      this.buttons[1].style.color = "rgb(140, 168, 97)";
      this.showProjects();
    })

    this.buttons[1].addEventListener("click", () => {
      this.switchSectionsEl.classList.add("active");
      this.buttons[0].style.color = "rgb(140, 168, 97)";
      this.buttons[1].style.color = "white";
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
    element.scrollIntoView({behavior: "smooth"});
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

class UlElement {
  constructor(listIsHiddenFn, hostElement, toggleClass = false){
    this.listIsHidden = listIsHiddenFn;
    this.hostElement = hostElement;
    this.ulElement = hostElement.nextElementSibling; //pozor, zalezi na poradi, davej metody jako posledni 
    this.toggleClass = toggleClass;
    this.render();
  }

  closeUlElement = () => {
    this.ulElement.hidden = true;
    this.hostElement.removeEventListener("click", this.closeUlElement);
    this.listIsHidden();

    if(!this.toggleClass){
      return;
    } else {
      this.hostElement.classList.add(this.toggleClass)
    }
  }

  render(){
    this.ulElement.hidden = false;
    this.hostElement.addEventListener("click", this.closeUlElement);
  }

}

class Tooltip extends Component {
  constructor(closeNotifierFn, hostElement, content = "", insertBefore) {
    super(hostElement, insertBefore); //potreba nebot dedi a ma vlastni konstruktor
    this.closeNotifier = closeNotifierFn;
    this.content = content;

    this.render();
  }

  closeTooltip = () => {
    this.detach();
    this.closeNotifier();
  };

  render() {
    const tooltipElement = document.createElement("div");
    tooltipElement.className = "card";
    if(this.content.trim() === "") {
      tooltipElement.textContent = "Content error!";
    } else {
      const tooltipTemplateElement = document.getElementById("tooltip");
      const tooltipBody = document.importNode(tooltipTemplateElement.content, true); //template se nerenderuje
      tooltipBody.querySelector("p").textContent = this.content;
      // console.log(tooltipBody.textContent);
      // console.log(tooltipTemplateElement)
      tooltipElement.append(tooltipBody);
    }
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
    this.tooltipContent = this.projectItemEl.dataset.extraInfo;
    this.tooltip = new Tooltip(() => {
      this.hasActiveTooltip = false;
    }, this.projectItemEl, this.tooltipContent, false);
    this.switchButton(type);
    this.moreInfoButton();
    this.connectDrag();
  }


  moreInfoButton() {
    const moreInfoButton = this.projectItemEl.querySelector("button:first-of-type");
    moreInfoButton.addEventListener("click", this.showMoreInfoHandler.bind(this));
  }

  showMoreInfoHandler() {
    if (this.hasActiveTooltip) return;

    this.tooltip.attach();
    this.hasActiveTooltip = true;
  }

  switchButton(type) {
    const projectItemEl = document.getElementById(this.id);
    let switchBtnEl = projectItemEl.querySelector("button:last-of-type");
    switchBtnEl = DOMHelper.clearEventListeners(switchBtnEl); //vycisti soucasne event listeners
    switchBtnEl.textContent = type === "active" ? "Finish" : "Activate";
    this.tooltip.detach();
    switchBtnEl.addEventListener(
      "click",
      this.updateProjectListsHandler.bind(null, this.id)
    );
  }

  update(updateProjectListsFn, type) {
    this.updateProjectListsHandler = updateProjectListsFn;
    this.switchButton(type); //aktualizujeme switch handler
  }

  connectDrag(){
    this.projectItemEl.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", this.id);
      event.dataTransfer.effectAllowed = "move";
    })

    this.projectItemEl.addEventListener("dragend", event => {
      console.log(event);
    })
  }
}

class ProjectList {
  projects = []; //zahaji se drive nez konstruktor
  hasHiddenList = true;

  constructor(type) {
    //aktivni nebo hotove projekty
    this.type = type;
    this.listHeader = document.querySelector(`#${type}-projects header`);
    const listItems = document.querySelectorAll(`#${type}-projects li`); //ziskam list projektu
    for (const project of listItems) {
      this.projects.push(
        new ProjectItem(project.id, this.switchProject.bind(this), this.type)
      );
    }
    this.showList();
    this.connectDroppable();
  }

  connectDroppable(){
    const list = document.querySelector(`#${this.type}-projects ul`);

    list.addEventListener("dragenter", event => {
      if(event.dataTransfer.types[0] === "text/plain"){
        list.classList.add("droppable");
        event.preventDefault();
      }
    });

    list.addEventListener("dragover", event => {
      if(event.dataTransfer.types[0] === "text/plain"){
        event.preventDefault();
      }
    });

    //zmena barvy seznamu kdyz pripominka opusti jeho oblast
    
    list.addEventListener("dragleave", event => {
      if(event.relatedTarget.closest(`#${this.type}-projects ul`) !== list){
        list.classList.remove("droppable");
      }
    });

    list.addEventListener("drop", event =>  {
      const prjId = event.dataTransfer.getData("text/plain");
      if(this.projects.find(p => p.id === prjId)){
        return;
      }

      document.getElementById(prjId).querySelector("button:last-of-type").click();
      list.classList.remove("droppable");
      event.preventDefault();
    });

  }

  showList(){
    this.listHeader.addEventListener("click", this.showListHandler.bind(this));
  }

  showListHandler() {
    if(!this.hasHiddenList) return;
  
    new UlElement(() => {this.hasHiddenList = true;}, this.listHeader, "rounded-full");
    this.hasHiddenList = false;
    this.listHeader.classList.remove("rounded-full");
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

  switchStatus(statusContent, imgSource) {
      const statusHolder = document.querySelector("#bunny-container p");
      const image = document.querySelector("#bunny-img-container img");

      statusHolder.textContent = statusContent;
      image.src = imgSource;
    }

  static init(finishedProjects) {
    const bunny = new Bunny();
    if (finishedProjects.length === 0) {
      bunny.switchStatus("Oh no! The bunny is hungry, hurry and feed the bunny!", "https://tinyurl.com/yvfjnzu9");
    } else if (finishedProjects.length < 5) {
      bunny.switchStatus("Brace yourself! Bunny felt the sweet taste of productivity and WANTS MORE!", "https://tinyurl.com/3t2ya26y");
    } else if (finishedProjects.length < 10 && finishedProjects.length >= 5){
      bunny.switchStatus("Good job! Bunny's hunger has been satiated.", "https://tinyurl.com/dc9s7bab");
    } else if (finishedProjects.length >= 10){
      bunny.switchStatus("The bunny is really full! It made you a cake to munch on in your free time ꉂ(˵˃ ᗜ ˂˵)", "https://tinyurl.com/5an9vj3e")
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
