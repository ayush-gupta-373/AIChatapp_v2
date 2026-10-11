import OtherUser from "./otherUser";

const OtherUsers = ({ users }) => {
  if (!users || users.length === 0) {
    return (
      <div className="text-center text-slate-500 text-sm py-6">
        No users found
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      {users.map((user) => (
        <OtherUser key={user._id} user={user} />
      ))}
    </div>
  );
};

export default OtherUsers;
