export default function Header({ title }) {
  return (
    <header className="bg-gray-800 text-white px-6 py-4 shadow-md">
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}