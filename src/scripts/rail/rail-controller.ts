type RailName = "left" | "right";

type RailState = {
  left: boolean;
  right: boolean;
  pinned: {
    left: boolean;
    right: boolean;
  };
};

const STORAGE_KEY = "gaga-rail-preference";

const defaultState: RailState = {
  left: false,
  right: false,
  pinned: {
    left: false,
    right: false
  }
};


function loadState(): RailState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return defaultState;

    return {
      ...defaultState,
      ...JSON.parse(saved)
    };
  } catch {
    return defaultState;
  }
}


function saveState(state: RailState) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}


function setRail(
  rail: RailName,
  expanded: boolean
) {

  const state = loadState();

  state[rail] = expanded;

  saveState(state);

  document.documentElement.dataset[
    `${rail}Rail`
  ] = expanded ? "expanded" : "collapsed";
}


function togglePin(
  rail: RailName
) {

  const state = loadState();

  state.pinned[rail] =
    !state.pinned[rail];

  saveState(state);

  document.documentElement.dataset[
    `${rail}RailPinned`
  ] = String(state.pinned[rail]);
}


export function initRailController() {

  const state = loadState();


  document.documentElement.dataset.leftRail =
    state.left ? "expanded" : "collapsed";

  document.documentElement.dataset.rightRail =
    state.right ? "expanded" : "collapsed";


  document
    .querySelectorAll<HTMLElement>(
      "[data-gaga-rail]"
    )
    .forEach((rail)=>{

      const name =
        rail.dataset.gagaRail as RailName;


      rail.addEventListener(
        "mouseenter",
        ()=>{

          if (!state.pinned[name]) {
            setRail(name,true);
          }

        }
      );


      rail.addEventListener(
        "mouseleave",
        ()=>{

          if (!state.pinned[name]) {
            setRail(name,false);
          }

        }
      );


      rail.addEventListener(
        "dblclick",
        ()=>{

          togglePin(name);

        }
      );

    });
}
