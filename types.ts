
interface Pizza {
    size: string;
    toppings: string[];
    delivery: boolean;
}

type FruitDictionary = Record<string, string>;
type PartialPizza = Partial<Pizza>;
type RequiredPizza = Required<PartialPizza>
type ReadonlyPizza = Readonly<PartialPizza>
type EssentialPizza = Pick<Pizza, 'size' | 'toppings'>;
type PizzaWithoutDelivery = Omit<Pizza, 'delivery'>;

// Excluding "Cookies" for a guest with dietary restrictions
type SnackOptions = "Cookies" | "Fruit";
type GuestSnackOptions = Exclude<SnackOptions, "Cookies">;
type NullableValue = string | null | undefined;
const guest1: GuestSnackOptions = "Fruit"; // Valid
type SureValue = NonNullable<NullableValue>;
const certainValue: SureValue = "Absolutely!";
type SweetFruit = Extract<string| number | boolean , string>;
const favouriteFruit:SweetFruit="Mango"
const customPizza: PartialPizza = {
  size: "Large",
  toppings: ["Pepperoni", "Mushrooms"],
};
type User = {
  name: string;
  age: number;
};

type Person = {
  name: any;
  age: any;
}

let person : Person = {
    name:"ali",
    age:"30"
};
console.log(typeof person)


let user: User = person;

const completePizza: RequiredPizza = {
  size: "Medium",
  toppings: ["Cheese", "Tomato"],
  delivery: true,
};


const classicPizza : ReadonlyPizza = {
    size:"Smlall",
    toppings:['olives','onions'],
    delivery:false
} 

const simplePizzas : EssentialPizza={
    size:"Mediuem",
    toppings:['Tommateaos','Chesse'],
}

const fruits: FruitDictionary = {
  mango: "Yellow and delicious",
  apple: "Red and round",
};


const inPersonPizza: PizzaWithoutDelivery = {
  size: "Large",
  toppings: ["Bacon", "Jalapeno"],
};


